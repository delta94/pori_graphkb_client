import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import useDeepCompareEffect from 'use-deep-compare-effect';
import {
  Collapse,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';


import { KBContext } from '../../KBContext';
import EdgeTable from '../EdgeTable';
import StatementSentence from '../StatementSentence';
import {
  CLASS_MODEL_PROP,
  FORM_VARIANT,
  sortAndGroupFields,
} from '../util';

import FieldGroup from './FieldGroup';
import EdgeFields from './EdgeFields';


/**
 * @param {object} props the input properties
 * @param {string} props.name the name of this form element used in propgating content to the parent form
 * @param {function} props.onChange the parent handler function
 * @param {function} props.onSubmit the parent handler function to submit the form contents
 * @param {function} props.onDelete the parent handler function to delete the current record
 * @param {function} props.reviewProps props to render statement reviews to be passed to detail chip
 * @param {Array.<string>} props.aboveFold the property names which should be put above the collapse
 * @param {Array.<string>} props.belowFold the property names which should be put in the collapsed section
 * @param {Array.<Array.<string>>} props.groups properties that should be grouped together
 * @param {bool} props.collapseExtra flag to indicate a collapsible section should be created
 */
const FormLayout = ({
  content, errors, onChange, variant, modelName, disabled, className, aboveFold, belowFold, collapseExtra, groups,
}) => {
  const { schema } = useContext(KBContext);

  const [isExpanded, setIsExpanded] = useState(false);

  const [model, setModel] = useState(null);

  useDeepCompareEffect(() => {
    setModel(schema.get(modelName));
  }, [schema, modelName]);

  if (!model) {
    return null;
  }

  const { extraFields, fields } = sortAndGroupFields(model, {
    aboveFold, belowFold, collapseExtra, variant, groups,
  });

  const isEdge = model && model.isEdge;

  const edges = isEdge
    ? []
    : schema.getEdges(content || {});
  const isStatement = model && model.name === 'Statement';

  return (
    <div className={`record-form ${className}`}>
      { model && (
      <>
        <div className="record-form__content record-form__content--long">
          {isStatement && variant !== FORM_VARIANT.SEARCH && (
          <StatementSentence
            schema={schema}
            content={content}
          />
          )}
          {isEdge && (
            <EdgeFields
              schema={schema}
              content={content}
              errors={errors}
              onChange={onChange}
              model={model}
              disabled={disabled}
              variant={variant}
            />
          )}
        </div>
        <div className="record-form__content">
          <FieldGroup
            schema={schema}
            content={content}
            errors={errors}
            onChange={onChange}
            ordering={fields}
            model={model}
            disabled={disabled}
            variant={variant}
          />
        </div>
        {extraFields.length > 0 && (
        <>
          <ListItem button onClick={() => setIsExpanded(!isExpanded)}>
            <ListItemText
              primary={
                  isExpanded
                    ? 'Close to hide optional fields'
                    : 'Expand to see all optional fields'
                }
            />
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <div className="record-form__content">
              <FieldGroup
                schema={schema}
                content={content}
                errors={errors}
                onChange={onChange}
                ordering={extraFields}
                model={model}
                disabled={disabled}
                variant={variant}
              />
            </div>
          </Collapse>
        </>
        )}

        {!variant === FORM_VARIANT.VIEW && edges.length > 0 && (
          <div className="record-form__related-nodes">
            <Typography variant="h6" component="h2">
              Related Nodes
            </Typography>
            <EdgeTable
              values={edges}
              sourceNodeId={content['@rid']}
              schema={schema}
            />
          </div>
        )}
      </>
      )}
    </div>
  );
};

FormLayout.propTypes = {
  aboveFold: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  belowFold: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
  collapseExtra: PropTypes.bool,
  groups: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  modelName: PropTypes.string,
  onChange: PropTypes.func,
  content: PropTypes.object,
  errors: PropTypes.object,
  variant: PropTypes.oneOf([
    FORM_VARIANT.EDIT,
    FORM_VARIANT.NEW,
    FORM_VARIANT.VIEW,
  ]),
};

FormLayout.defaultProps = {
  aboveFold: [CLASS_MODEL_PROP, 'displayName', 'name', 'groups', 'journalName', 'out', 'in',
    'permissions', 'evidenceLevel', 'reviewStatus', 'reviews'],
  disabled: false,
  belowFold: ['deprecated', 'history'],
  className: '',
  collapseExtra: false,
  groups: [
    ['@rid', 'createdBy', 'createdAt', 'deletedBy', 'deletedAt', 'uuid', 'history', 'groupRestrictions'],
    ['relevance', 'appliesTo'],
    ['reviewStatus', 'reviews'],
    ['reference1', 'break1Repr', 'break1Start', 'break1End'],
    ['reference2', 'break2Repr', 'break2Start', 'break2End'],
    ['source', 'sourceId', 'sourceIdVersion'],
    ['startYear', 'completionYear'],
    ['city', 'country'],
    ['out', 'in'],
  ],
  modelName: null,
  onChange: () => null,
  content: {},
  errors: {},
  variant: FORM_VARIANT.VIEW,
};

export default FormLayout;
