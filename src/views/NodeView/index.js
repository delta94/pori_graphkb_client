import React from 'react';
import PropTypes from 'prop-types';
import * as qs from 'qs';

import { boundMethod } from 'autobind-decorator';
import NodeForm from '../../components/RecordForm';
import { KBContext } from '../../components/KBContext';
import { FORM_VARIANT } from '../../components/RecordForm/util';
import { cleanLinkedRecords } from '../../components/util';
import auth from '../../services/auth';


const DEFAULT_TITLES = {
  [FORM_VARIANT.EDIT]: 'Edit this Record',
  [FORM_VARIANT.NEW]: 'Add a new Record (:modelName)',
  [FORM_VARIANT.DELETE]: 'Delete this Record',
  [FORM_VARIANT.VIEW]: 'Record Contents',
  [FORM_VARIANT.SEARCH]: 'Search for a Record (:modelName)',
};


const getVariantType = (url) => {
  let variant = FORM_VARIANT.VIEW;
  for (const variantName of Object.values(FORM_VARIANT)) { // eslint-disable-line no-restricted-syntax
    if (url.includes(variantName)) {
      variant = variantName;
      break;
    }
  }
  return variant;
};


class NodeView extends React.PureComponent {
  static contextType = KBContext;

  static propTypes = {
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  /**
   * After the form is submitted/completed. Handle the corresponding redirect
   */
  @boundMethod
  handleSubmit(result = null) {
    const { schema } = this.context;
    const { history, match: { path } } = this.props;
    const variant = getVariantType(path);
    if (result && (variant === FORM_VARIANT.NEW || variant === FORM_VARIANT.EDIT)) {
      history.push(schema.getLink(result));
    } else if (variant === FORM_VARIANT.DELETE) {
      history.push('/');
    } else if (result && variant === FORM_VARIANT.SEARCH) {
      // redirect to the data view page
      const search = qs.stringify(cleanLinkedRecords(result));
      history.push(`/data/table?${search}`, { search, content: result });
    } else {
      history.goBack();
    }
  }

  /**
   * Handles the redirect if an error occurs in the child component
   */
  @boundMethod
  handleError({ error = {}, content = null }) {
    const { history } = this.props;
    const { name, message } = error;

    if (name === 'RecordExistsError' && content) {
      // redirect to the data view page
      const search = qs.stringify(cleanLinkedRecords(content));
      history.push(`/data/table?${search}`, { search, content });
    } else {
      history.push('/error', { error: { name, message } });
    }
  }

  render() {
    const {
      match: { params: { rid = null, modelName }, path },
      history,
    } = this.props;
    const { schema } = this.context;
    const variant = getVariantType(path);

    let defaultModelName = modelName;

    if (modelName) {
      const model = schema.get(modelName);
      defaultModelName = model.name;
      if (!model || (model.isAbstract && variant === FORM_VARIANT.EDIT)) {
        history.push(
          '/error',
          {
            error: {
              name: 'PageNotFound',
              message: `Page Not Found. '${modelName}' is not a valid model`,
            },
          },
        );
      }
    } else if (path.includes('/user/')) {
      defaultModelName = 'User';
    } else if (path.includes('/usergroup/')) {
      defaultModelName = 'UserGroup';
    } else if (path.includes('/e/')) {
      defaultModelName = 'E';
    }

    // redirect when the user clicks the top left button
    const onTopClick = (record) => {
      let newPath = path
        .replace(variant,
          variant === FORM_VARIANT.EDIT
            ? FORM_VARIANT.VIEW
            : FORM_VARIANT.EDIT)
        .replace(':rid', rid);
      if (record['@class'] || modelName) {
        newPath = newPath.replace(':modelName', schema.get(record['@class'] || modelName).routeName.slice(1));
      }
      history.push(newPath);
    };

    return (
      <NodeForm
        variant={variant}
        modelName={defaultModelName}
        rid={rid}
        title={DEFAULT_TITLES[variant].replace(':modelName', defaultModelName || '')}
        onTopClick={
          auth.hasWriteAccess()
            ? onTopClick
            : null
        }
        onSubmit={this.handleSubmit}
        onError={this.handleError}
      />
    );
  }
}


export default NodeView;