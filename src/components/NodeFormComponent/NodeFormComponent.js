import React, { Component } from "react";
import ReactDOM from "react-dom";
import "./NodeFormComponent.css";
import {
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Button,
  Typography,
  Divider
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import FolderIcon from "@material-ui/icons/Folder";
import TrendingFlatIcon from "@material-ui/icons/TrendingFlat";
import AutoSearchComponent from "../../components/AutoSearchComponent/AutoSearchComponent";
import ResourceSelectComponent from "../../components/ResourceSelectComponent/ResourceSelectComponent";
import api from "../../services/api";
import * as jc from "json-cycle";
import { Redirect } from "react-router-dom";

//TODO: Implement variants
class NodeFormComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      node: {},
      form: {
        source: "",
        sourceId: "",
        name: "",
        longName: "",
        description: "",
        sourceIdVersion: "",
        subsets: [],
        subset: "",
        relationship: {
          "@class": "", //strip these on submit
          targetName: "", //---------------------
          in: "",
          out: "",
          source: ""
        },
        relationships: []
      },
      edgeTypes: [],
      sources: []
    };

    this.handleFormChange = this.handleFormChange.bind(this);
    this.handleSubsetAdd = this.handleSubsetAdd.bind(this);
    this.handleSubsetDelete = this.handleSubsetDelete.bind(this);
    this.handleRelationshipAdd = this.handleRelationshipAdd.bind(this);
    this.handleRelationship = this.handleRelationship.bind(this);
    this.handleRelationshipDirection = this.handleRelationshipDirection.bind(
      this
    );
    this.handleRelationshipDelete = this.handleRelationshipDelete.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.initNode = this.initNode.bind(this);
  }

  async componentDidMount() {
    const sources = await api.getSources();
    const edgeTypes = await api.getEdgeTypes();

    this.setState({ sources, edgeTypes }, () => {
      if (this.props.variant === "edit") {
        this.initNode();
      } else{
        const {form} =this.state;
        form.relationship.out = -1;
        
      }
    });
  }

  //TODO: flag
  initNode() {
    function processRelationships(node, relationships, key) {
      if (node["in_" + key]) {
        node["in_" + key].forEach(edge => {
          relationships.push({
            "@rid": edge["@rid"],
            in: edge.in["@rid"],
            out: edge.out["@rid"],
            "@class": key,
            targetName:
              edge.in.name === node.name ? edge.out.name : edge.in.name,
            source: edge.source["@rid"] || edge.source
          });
        });
      }
      if (node["out_" + key]) {
        node["out_" + key].forEach(edge => {
          relationships.push({
            "@rid": edge["@rid"],
            in: edge.in["@rid"],
            out: edge.out["@rid"],
            "@class": key,
            targetName:
              edge.in.name === node.name ? edge.out.name : edge.in.name,
            source: edge.source["@rid"] || edge.source
          });
        });
      }
      return relationships;
    }
    api
      .get("/diseases/" + this.props.selectedId.slice(1) + "?neighbors=3")
      .then(response => {
        response = jc.retrocycle(response.result);
        let relationships = [];
        this.state.edgeTypes.forEach(type => {
          relationships = processRelationships(
            response,
            relationships,
            type.name
          );
        });
        const { node, form } = this.state;
        Object.keys(response).forEach(key => {
          node[key] =
            key === "subsets"
              ? response[key].slice(0, response[key].length)
              : response[key];
          form[key] = response[key];
        });
        node.relationships = relationships.slice(0, relationships.length); //preserve initial state
        form.relationships = relationships;
        form.relationship.out = response["@rid"];

        this.setState({ node, form }, () => console.log(this.state));
      });
  }

  handleFormChange(e) {
    const { form } = this.state;
    form[e.target.name] = e.target.value;
    this.setState({ form });
  }
  handleSubsetAdd(e) {
    e.preventDefault();
    const { form } = this.state;

    if (form.subset && !form.subsets.includes(form.subset)) {
      form.subsets.push(form.subset);
      form.subset = "";
      this.setState({ form });
    }
  }
  handleSubsetDelete(subset) {
    const { form } = this.state;
    if (form.subsets.indexOf(subset) !== -1) {
      form.subsets.splice(form.subsets.indexOf(subset), 1);
    }
    this.setState({ form });
  }
  handleRelationshipAdd(e) {
    e.preventDefault();
    const { form } = this.state;
    const { relationship, relationships } = form;
    if (
      relationship.in &&
      relationship.out &&
      relationship["@class"] &&
      relationship.source
    ) {
      if (
        relationships.filter(
          r =>
            r.out === relationship.out &&
            r.in === relationship.in &&
            r["@class"] === relationship["@class"] &&
            r.source === relationship.source
        ).length === 0
      ) {
        relationships.push(relationship);
        form.relationships = relationships;
        form.relationship = {
          "@class": "", //strip these
          targetName: "",
          in: "",
          out: this.state.node["@rid"],
          source: ""
        };
        this.setState({ form });
      }
    }
  }
  handleRelationshipDelete(relationship) {
    const { form } = this.state;
    const relationships = form.relationships;
    if (relationships.indexOf(relationship) !== -1) {
      relationships.splice(relationships.indexOf(relationship), 1);
    }
    form.relationships = relationships;
    this.setState({ form });
  }
  handleRelationship(e) {
    const { form, node } = this.state;
    form.relationship[e.target.name] = e.target.value;
    if (e.target["@rid"]) {
      form.relationship.in === node["@rid"]
        ? (form.relationship.out = e.target["@rid"])
        : (form.relationship.in = e.target["@rid"]);
    }
    this.setState({ form });
  }
  handleRelationshipDirection(e) {
    const { form, node } = this.state;

    if (form.relationship.in === node["@rid"]) {
      form.relationship.in = form.relationship.out;
      form.relationship.out = node["@rid"];
    } else {
      form.relationship.out = form.relationship.in;
      form.relationship.in = node["@rid"];
    }
    this.setState({ form });
  }
  handleSubmit(e) {
    e.preventDefault();
    this.props.variant === "edit" ? this.editSubmit() : this.addSubmit();
  }

  async editSubmit() {
    const { form, node } = this.state;
    node.relationships.forEach(async initRelationship => {
      if (
        form.relationships.filter(
          r =>
            r.out === initRelationship.out &&
            r.in === initRelationship.in &&
            r["@class"] === initRelationship["@class"] &&
            r.source === initRelationship.source
        ).length === 0
      ) {
        await api.delete(
          "/" +
            initRelationship["@class"].toLowerCase() +
            "/" +
            initRelationship["@rid"].slice(1)
        );
      }
    });
    form.relationships.forEach(async currRelationship => {
      if (
        node.relationships.filter(
          r =>
            r.out === currRelationship.out &&
            r.in === currRelationship.in &&
            r["@class"] === currRelationship["@class"] &&
            r.source === currRelationship.source
        ).length === 0
      ) {
        await api.post("/" + currRelationship["@class"].toLowerCase(), {
          in: currRelationship.in,
          out: currRelationship.out,
          source: currRelationship.source
        });
      }
    });

    const payload = {};
    let changed = false;
    if (form.name !== node.name) (changed = true), (payload.name = form.name);
    if (form.name !== node.name)
      (changed = true), (payload.longName = form.longName);
    if (form.description !== node.description)
      (changed = true), (payload.description = form.description);
    if (form.sourceIdVersion !== node.sourceIdVersion)
      (changed = true), (payload.sourceIdVersion = form.sourceIdVersion);
    payload.subsets = [];
    form.subsets.forEach(subset => {
      if (!node.subsets.includes(subset))
        (changed = true), payload.subsets.push(subset);
    });
    node.subsets.forEach(subset => {
      if (form.subsets.includes(subset)) payload.subsets.push(subset);
    });

    if (changed) {
      api
        .patch(
          "/" +
            node["@class"].toLowerCase() +
            "s/" +
            this.state.node["@rid"].slice(1),
          payload
        )
        .then(response => {
          console.log(response);
          response.result.source = this.state.node.source;
          response.result.sourceId = this.state.node.sourceId;

          this.props.handleNodeEdit(response.result);
        })
        .catch(error => {});
    }
  }
  async addSubmit() {
    const { form } = this.state;

    const response = await api.post("/diseases", {
      source: form.source,
      sourceId: form.sourceId,
      name: form.name,
      longName: form.longName,
      subsets: form.subsets,
      description: form.description,
      sourceIdVersion: form.sourceIdVersion
    });

    form.relationships.forEach(async relationship => {
      relationship.in === -1
        ? (relationship.in = response.result["@rid"])
        : (relationship.out = response.result["@rid"]);
      await api.post("/" + relationship["@class"].toLowerCase(), {
        in: relationship.in,
        out: relationship.out,
        source: relationship.source
      });
    });
  }

  render() {
    const { form, node, edgeTypes } = this.state;

    const subsets = form.subsets.map(subset => {
      return (
        <ListItem key={subset}>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary={subset} style={{ overflow: "auto" }} />
          <IconButton
            onClick={e => {
              this.handleSubsetDelete(subset);
            }}
          >
            <CloseIcon color="error" />
          </IconButton>
        </ListItem>
      );
    });
    const relationships = form.relationships.map(relationship => {
      const sourceName = this.state.sources.find(
        s => s["@rid"] === relationship.source
      ).name;
      const typeName =
        relationship.in === node["@rid"]
          ? "has" +
            relationship["@class"].slice(0, relationship["@class"].length - 2)
          : relationship["@class"];
      return (
        <ListItem key={relationship["@class"] + ": " + relationship.targetName}>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText
            primary={typeName + ": " + relationship.targetName}
            secondary={sourceName}
            style={{ overflow: "auto" }}
          />
          <IconButton
            color="secondary"
            onClick={e => {
              this.handleRelationshipDelete(relationship);
            }}
          >
            <CloseIcon color="error" />
          </IconButton>
        </ListItem>
      );
    });
    const edgeTypesDisplay = edgeType => {
      const inOut =
        form.relationship.in === node["@rid"]
          ? "has" + edgeType.name.slice(0, edgeType.name.length - 2)
          : edgeType.name;
      return (
        <MenuItem key={edgeType.name} value={edgeType.name}>
          {inOut}
        </MenuItem>
      );
    };
    const source =
      this.props.variant === "edit" ? (
        <ListItem>
          <ListItemText
            primary="Source:"
            secondary={node.source ? node.source.name : null}
          />
        </ListItem>
      ) : (
        <ListItem>
          <ResourceSelectComponent
            value={form.source}
            onChange={this.handleFormChange}
            name="source"
            label="Source"
            id="source"
            resources={this.state.sources}
          />
        </ListItem>
      );
    const sourceId =
      this.props.variant === "edit" ? (
        <ListItem>
          <ListItemText
            primary="Source ID:"
            secondary={this.state.node.sourceId}
          />
        </ListItem>
      ) : (
        <ListItem className="input-wrapper">
          <TextField
            id="sourceId"
            placeholder="eg. NCIT:0123"
            label="Source ID"
            value={form.sourceId}
            onChange={this.handleFormChange}
            className="text-input"
            name="sourceId"
          />
        </ListItem>
      );

    return (
      <div className="edit-node-wrapper">
        {/* Style */}
        <Typography variant="display1" className="form-title">
          {this.props.variant === "edit" ? "Edit Term" : "Add New Term"}
        </Typography>
        <Divider />
        <form onSubmit={this.handleSubmit}>
          <div className="param-section">
            <Typography variant="title">Basic Parameters</Typography>
            <List component="nav">
              {source}
              {sourceId}
              <ListItem className="input-wrapper">
                <TextField
                  id="name"
                  placeholder="eg. angiosarcoma"
                  label="Name"
                  value={form.name}
                  onChange={this.handleFormChange}
                  className="text-input"
                  name="name"
                />
              </ListItem>
              <ListItem className="input-wrapper">
                <TextField
                  id="longName"
                  label="Long Name"
                  value={form.longName}
                  onChange={this.handleFormChange}
                  className="text-input"
                  name="longName"
                  multiline
                />
              </ListItem>
              <ListItem className="input-wrapper">
                <TextField
                  id="description"
                  label="Description"
                  value={form.description}
                  onChange={this.handleFormChange}
                  className="text-input"
                  name="description"
                  multiline
                />
              </ListItem>
              <ListItem className="input-wrapper">
                <TextField
                  id="sourceIdVersion"
                  label="Source ID Version"
                  value={form.sourceIdVersion}
                  onChange={this.handleFormChange}
                  className="text-input"
                  name="sourceIdVersion"
                />
              </ListItem>
            </List>
          </div>
          <div className="param-section">
            <Typography variant="title">Subsets</Typography>
            <ListItem className="input-wrapper">
              <TextField
                id="subset-temp"
                label="Add a Subset"
                value={form.subset}
                onChange={this.handleFormChange}
                className="text-input"
                name="subset"
                onKeyDown={e => {
                  if (e.keyCode === 13) {
                    this.handleSubsetAdd(e);
                  }
                }}
              />
              <IconButton color="primary" onClick={this.handleSubsetAdd}>
                <AddIcon />
              </IconButton>
            </ListItem>
            <List className="list">{subsets}</List>
          </div>
          <div className="param-section">
            <Typography variant="title">Relationships</Typography>
            <ListItem
              className="input-wrapper relationship-add-wrapper"
              onKeyDown={e => {
                if (e.keyCode === 13) this.handleRelationshipAdd(e);
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: "1"
                }}
              >
                <ResourceSelectComponent
                  value={form.relationship.source}
                  onChange={this.handleRelationship}
                  name="source"
                  label="Source"
                  resources={this.state.sources}
                />
                <div style={{ display: "flex", width: "100%" }}>
                  <div className="relationship-dir-type">
                    <IconButton
                      disableRipple
                      name="direction"
                      onClick={this.handleRelationshipDirection}
                      color="primary"
                    >
                      <TrendingFlatIcon
                        style={{ margin: "20px 24px 0 0" }}
                        className={
                          form.relationship.in === node["@rid"]
                            ? "relationship-in"
                            : "relationship-out"
                        }
                      />
                    </IconButton>
                    <ResourceSelectComponent
                      value={form.relationship["@class"]}
                      onChange={this.handleRelationship}
                      name="@class"
                      label="Type"
                      resources={this.state.edgeTypes}
                    >
                      {edgeTypesDisplay}
                    </ResourceSelectComponent>
                  </div>
                  <div className="search-wrap">
                    <AutoSearchComponent
                      value={form.relationship.targetName}
                      onChange={this.handleRelationship}
                      placeholder="Target Name"
                      limit={10}
                      name="targetName"
                    />
                  </div>
                </div>
              </div>
              <IconButton
                style={{ margin: "auto 8px" }}
                color="primary"
                onClick={this.handleRelationshipAdd}
              >
                <AddIcon />
              </IconButton>
            </ListItem>
            <List className="list">{relationships}</List>
          </div>
          <div className="submit-button">
            <Button type="submit" variant="outlined">
              {this.props.variant === "edit" ? "Confirm Changes" : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    );
  }
}
export default NodeFormComponent;
