/**
 * @module /views/AddOntologyView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OntologyFormComponent from '../../components/OntologyFormComponent/OntologyFormComponent';

/**
 * View for editing or adding database nodes. Includes a NodeFormComponent with the
 * 'add' variant. Submissions will post to the server, and redirect user to the home
 * query page.
 */
class AddOntologyView extends Component {
  constructor(props) {
    super(props);

    this.handleNodeFinish = this.handleNodeFinish.bind(this);
  }

  /**
   * Triggered when the user hits the submit button.
   */
  handleNodeFinish() {
    const { history } = this.props;
    history.push('/query');
  }

  render() {
    return (
      <OntologyFormComponent
        variant="add"
        handleNodeFinish={this.handleNodeFinish}
      />
    );
  }
}

AddOntologyView.propTypes = {
  /**
   * @param {Object} history - history state object.
   */
  history: PropTypes.object.isRequired,
};

export default AddOntologyView;