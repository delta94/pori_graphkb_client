import * as jc from 'json-cycle';
import config from '../config.json';

const { DEFAULT_PROPS } = config;
const { PALLETE_SIZES } = config.GRAPH_DEFAULTS;
const CACHE_EXPIRY = 8;
const ACRONYMS = ['id', 'uuid', 'ncit', 'uberon', 'doid', 'url'];
const GRAPH_OBJECTS_KEY = 'graphObjects';

/**
 * Handles miscellaneous tasks.
 */
export default class util {
  /**
   * Un-camelCase's input string.
   * @param {string} str - camelCase'd string.
   */
  static antiCamelCase(str) {
    let accstr = str;
    if (accstr.startsWith('@')) accstr = accstr.slice(1);
    let words = [accstr];
    if (accstr.includes('.')) {
      words = accstr.split('.');
    }

    words.forEach((word, i) => {
      words[i] = word.replace(/[A-Z]/g, match => ` ${match}`).trim();
    });

    ACRONYMS.forEach((acronym) => {
      const re = new RegExp(`[^\\w]*${acronym}(?!\\w)`, 'ig');
      words.forEach((word, i) => {
        const w = word.replace(re, match => match.toUpperCase());
        words[i] = w.charAt(0).toUpperCase() + w.slice(1);
      });
    });

    accstr = words.join(' ');
    return accstr.trim();
  }

  /**
   * Returns a representative field of a given object. Defaults to:
   * sourceId, then name, then if neither are present, the first primitive
   * type field in the object.
   * @param {Object} obj - target data object.
   */
  static getPreview(obj) {
    let preview;
    DEFAULT_PROPS.forEach((prop) => {
      if (obj[prop]) {
        if (!preview) {
          preview = obj[prop];
        }
      }
    });
    if (!preview) {
      const prop = Object.keys(obj).find(key => typeof obj[key] !== 'object');
      preview = obj[prop];
    }
    return preview;
  }

  /**
   * Formatter meant for edge types given in the form:
   * '['in' | 'out']_[edgeType]'.
   *
   *    Format string:  in_[edgeType] => has[edgeType]
   *                    out_[edgeType] => [edgeType]
   *
   * @param {string} str - string to be formatted.
   */
  static getEdgeLabel(str) {
    const edgeType = str.split('_')[1];
    let retstr = edgeType;

    if (str.startsWith('in_')) {
      switch (edgeType.slice(edgeType.length - 2, edgeType.length)) {
        case 'By':
          if (
            ['a', 'e', 'i', 'o', 'u', 'y']
              .includes(edgeType.slice(edgeType.length - 6, edgeType.length - 5))
          ) {
            retstr = `${edgeType.slice(0, edgeType.length - 3)}s`;
          } else {
            retstr = `${edgeType.slice(0, edgeType.length - 4)}s`;
          }
          break;
        case 'Of':
          retstr = `has${edgeType.slice(0, edgeType.length - 2)}`;
          break;
        case 'es':
          retstr = `${edgeType.slice(0, edgeType.length - 1)}dBy`;
          break;
        case 'rs':
          retstr = `${edgeType.slice(0, edgeType.length - 1)}redBy`;
          break;
        default:
          break;
      }
    }
    return retstr;
  }

  /**
   * Returns the plaintext representation of a value in order to be loaded into
   * a TSV file. Parses nested objects and arrays using the key as reference.
   * @param {any} value - Value
   * @param {string} key - Object Key.
   */
  static getTSVRepresentation(value, key) {
    if (typeof value !== 'object') {
      return (value || '').toString().replace(/[\r\n\t]/g, ' ');
    }
    if (Array.isArray(value)) {
      let list;
      if (key.startsWith('in_')) {
        list = value.map(obj => obj.out['@rid'] || obj.out);
      } else if (key.startsWith('out_')) {
        list = value.map(obj => obj.in['@rid'] || obj.in);
      } else {
        list = value.map(obj => this.getTSVRepresentation(obj, key));
      }
      return list.join(', ');
    }
    if (key.includes('.')) {
      const newKey = key.split('.')[1];
      return this.getTSVRepresentation(value[newKey], newKey);
    }
    return this.getPreview(value);
  }

  /**
   * Prepares a payload to be sent to the server for a POST, PATCH, or GET requst.
   * @param {Object} form - unprocessed form object containing user data.
   * @param {*} editableProps - List of valid properties for given form.
   * @param {*} exceptions - List of extra parameters not specified in editableProps.
   */
  static parsePayload(form, editableProps, exceptions) {
    const payload = Object.assign({}, form);
    Object.keys(payload).forEach((key) => {
      if (!payload[key]) delete payload[key];
      // For link properties, must specify record id being linking to. Clear the rest.
      if (key.includes('.@rid')) {
        const nestedKey = key.split('.')[0];
        if (editableProps.find(p => p.name === nestedKey)
          || (exceptions && exceptions.find(p => p.name === nestedKey))
        ) {
          // Sets top level property to the rid: ie.
          // 'source.@rid': #18:5 => 'source': #18:5
          payload[key.split('.')[0]] = payload[key];
          delete payload[key];
        }
      }
      // Clears out all other unknown fields.
      if (!editableProps.find(p => p.name === key)) {
        if (!exceptions || !exceptions.find(p => p.name === key)) {
          delete payload[key];
        }
      }
    });
    return payload;
  }

  /**
   * Returns pallette of colors for displaying objects of given type.
   */
  static getPallette(n, type) {
    const baseName = `${type.toUpperCase().slice(0, type.length - 1)}_COLORS_`;
    const maxPalletteSize = PALLETE_SIZES[PALLETE_SIZES.length - 1];
    for (let i = 0; i < PALLETE_SIZES.length; i += 1) {
      if (n <= PALLETE_SIZES[i]) {
        return config.GRAPH_DEFAULTS[baseName + PALLETE_SIZES[i]];
      }
    }

    const list = config.GRAPH_DEFAULTS[baseName + maxPalletteSize];
    for (let i = maxPalletteSize; i < n; i += 1) {
      const color = `000000${Math.round(Math.random() * (255 ** 3)).toString(16)}`;
      list.push(`#${color.substr(color.length - 6)}`);
    }
    return list;
  }

  /**
   * Saves current graph state into localstorage, identified by the url search parameters.
   * @param {Object} search - collection of search parameters.
   * @param {Object} data - graph data to be stored.
   */
  static loadGraphData(search, data) {
    data.filteredSearch = search;
    localStorage.setItem(GRAPH_OBJECTS_KEY, JSON.stringify(jc.decycle(data)));
  }

  /**
   * Retrieves graph data from localstorage for the input search parameters.
   * @param {Object} search - collection of search parameters .
   */
  static getGraphData(search) {
    const data = localStorage.getItem(GRAPH_OBJECTS_KEY);
    if (data) {
      const obj = jc.retrocycle(JSON.parse(data));
      if (obj.filteredSearch === search) {
        return obj;
      }
    }
    return null;
  }

  /**
   * Updates valid properties and color mappings for graph objects.
   * @param {Array} newColumns - Current list of valid properties
   * @param {Object} node - new node object to be processed.
   * @param {Object} propsMap - Property map containing color mappings.
   */
  static loadColorProps(newColumns, node, propsMap) {
    // Iterate over all props.
    newColumns.forEach((prop) => {
      let obj = node;
      let key = prop;

      // Nested prop condition
      if (prop.includes('.')) {
        key = prop.split('.')[1];
        obj = node[prop.split('.')[0]] || {};
      }

      if (obj[key] && (obj[key].length < 50 || key === 'name') && !Array.isArray(obj[key])) {
        if (propsMap.nodes[prop] === undefined) {
          propsMap.nodes[prop] = [obj[key]];
        } else if (
          propsMap.nodes[prop] // If null, fails here
          && !propsMap.nodes[prop].includes(obj[key])
        ) {
          propsMap.nodes[prop].push(obj[key]);
        }
      } else if (propsMap.nodes[prop] && !propsMap.nodes[prop].includes('null')) {
        // This null represents nodes that do not contain specified property.
        propsMap.nodes[prop].push('null');
      }
      // Permanently removes certain properties from being eligible to display
      // due to content length.
      if (obj[key] && obj[key].length >= 50 && key !== 'name') {
        propsMap.nodes[prop] = null;
      }
    });
    return propsMap;
  }

  /**
   * Updates expandable map for input rid.
   * @param {Array} expandedEdgeTypes - List of valid edge types.
   * @param {Object} graphObjects - Collection of all graph objects.
   * @param {string} rid - identifier for input node.
   * @param {Object} expandable - Expandable flags map.
   */
  static expanded(expandedEdgeTypes, graphObjects, rid, expandable) {
    let targetFlag = false;
    expandedEdgeTypes.forEach((e) => {
      if (graphObjects[rid][e]) {
        graphObjects[rid][e].forEach((l) => {
          if (
            !graphObjects[l['@rid'] || l]
            && !((l.in || {})['@class'] === 'Statement' || (l.out || {})['@class'] === 'Statement')
          ) {
            targetFlag = true;
          }
        });
      }
    });
    expandable[rid] = targetFlag;
    return expandable;
  }
}
