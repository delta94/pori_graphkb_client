import React, {
  useContext, useReducer, useEffect, useState,
} from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import PropTypes from 'prop-types';
import CancelIcon from '@material-ui/icons/Cancel';

import './index.scss';
import {
  FormLabel, FormControl, IconButton, FormHelperText,
} from '@material-ui/core';
import FormLayout from '../FormLayout';
import FormField from '.';
import {
  FORM_VARIANT,
} from '../util';
import { KBContext } from '../../KBContext';


/**
   * Form/View that displays the contents of a single node
   *
   * @property {string} props.variant the type of NodeForm to create
   * @property {string} props.rid the record id of the current record for the form
   * @property {string} props.title the title for this form
   * @property {string} props.modelName name of class model to be displayed
   * @property {object} props.schema schema object defining class/prop models
   * @property {value} props.value values of individual properties of passed class model
   */
const EmbeddedRecord = ({
  value: initialValue,
  errors,
  modelName: modelNameParam,
  variant,
  disabled,
  required,
  onChange,
  name: formName,
  helperText,
  FormLayoutComponent = FormLayout,
  ...rest
}) => {
  const { schema } = useContext(KBContext);

  const [modelName, setModelName] = useState((initialValue && initialValue['@class']) || '');
  const [modelOptions, setModelOptions] = useState([]);

  // handle and store the form content
  const [formContent, setFormFieldContent] = useReducer((state, action) => {
    const { type: actionType, payload } = action;

    if (actionType === 'update') {
      const { name, value } = payload;
      return { ...state, [name]: value };
    } if (actionType === 'replace') {
      return { ...payload };
    }
    throw new Error(`actionType (${actionType}) not implemented`);
  }, initialValue || {});

  // handle and store any errors reported from form field validators
  const [formErrors, setFormFieldError] = useReducer((state, action) => {
    const { type: actionType, payload } = action;

    if (actionType === 'update') {
      const { name, value } = payload;
      return { ...state, [name]: value };
    } if (actionType === 'replace') {
      return { ...payload };
    }
    throw new Error(`actionType (${actionType}) not implemented`);
  }, errors || {});

  const formHasErrors = Object.values(formErrors).some(err => err);

  // if the parent form passes down new values, replace the current ones
  useDeepCompareEffect(() => {
    setFormFieldContent({ type: 'replace', payload: initialValue });
    setFormFieldError({ type: 'replace', payload: errors });
  }, [initialValue, errors, schema]);

  useEffect(() => {
    setModelName(formContent['@class']);
  }, [formContent]);

  // propagate aggregated content and errors to parent form
  useDeepCompareEffect(() => {
    onChange({ target: { name: formName, value: formContent, error: formHasErrors ? formErrors : '' } });
  }, [formContent, formErrors]);

  // change the model options when the input modelName changes
  useEffect(() => {
    if (schema) {
      const options = schema.get(modelNameParam).descendantTree(true).map(m => ({
        label: m.name, value: m.name, key: m.name, caption: m.description,
      }));
      setModelOptions(options);

      if (options.length === 1) {
        setModelName(options[0].name);
      }
    }
  }, [modelNameParam, schema]);

  const handleOnChange = (event) => {
    // add the new value to the field
    const eventName = event.target.name || event.target.getAttribute('name'); // name of the form field triggering the event
    const eventValue = event.target.value;

    const { properties: { [eventName]: prop } } = schema.get(modelName);
    const { value, error } = schema.validateValue(prop, eventValue, variant === FORM_VARIANT.SEARCH);
    setFormFieldContent({ type: 'update', payload: { name: eventName, value } });
    setFormFieldError({ type: 'update', payload: { name: eventName, value: error } });
  };

  if ((!formContent || !formContent['@class']) && variant === FORM_VARIANT.VIEW) {
    return null;
  }
  return (
    <FormControl className="embedded-record" required={required} disabled={disabled} error={formHasErrors}>
      <div className="embedded-record__header">
        <FormLabel>
          {formName}
        </FormLabel>
        { !disabled && (
          <IconButton
            onClick={() => onChange({ target: { name: formName, value: null } })}
          >
            <CancelIcon />
          </IconButton>
        )}
      </div>
      <div className="embedded-record__content">
        <FormField
          model={{
            choices: modelOptions, required: true, name: '@class', type: 'string',
          }}
          value={modelName}
          onChange={({ target: { value } }) => {
            setFormFieldContent({ type: 'update', payload: { name: '@class', value } });
            setFormFieldError({ type: 'update', payload: { name: 'message', value: '' } });
          }}
          disabled={modelOptions.length < 2 || disabled}
          schema={schema}
          error={formErrors['@class'] || ''}
          className="record-form__class-select"
        />
        {formContent && formContent['@class'] && (
          <FormLayoutComponent
            {...rest}
            content={formContent}
            errors={formErrors}
            onChange={handleOnChange}
            modelName={formContent['@class']}
            variant={variant}
            disabled={disabled}
          />
        )}
      </div>
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

EmbeddedRecord.propTypes = {
  modelName: PropTypes.string,
  onDelete: PropTypes.func,
  onChange: PropTypes.func,
  onTopClick: PropTypes.func,
  variant: PropTypes.string,
  value: PropTypes.object,
  errors: PropTypes.object,
  name: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  helperText: PropTypes.string,
  FormLayoutComponent: PropTypes.oneOf([PropTypes.object, PropTypes.func]),
};

EmbeddedRecord.defaultProps = {
  disabled: false,
  required: false,
  modelName: '',
  onDelete: () => {},
  onChange: () => {},
  helperText: '',
  onTopClick: null,
  variant: FORM_VARIANT.VIEW,
  value: {},
  errors: {},
  FormLayoutComponent: FormLayout,
};

export default EmbeddedRecord;
