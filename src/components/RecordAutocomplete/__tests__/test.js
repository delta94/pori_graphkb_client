import React from 'react';
import { mount } from 'enzyme';
import AsyncSelect from 'react-select/lib/Async';
import Select from 'react-select';
import { Chip } from '@material-ui/core';

import RecordAutocomplete from '..';
import { Placeholder, SingleValue } from '../components';


const mockSearchHandler = (values = []) => {
  const request = jest.fn();
  request.mockResolvedValue(
    values.map(
      (value, index) => Object.assign({}, { '@rid': `#1:${index}` }, value),
    ),
  );
  return jest.fn().mockReturnValue({ abort: jest.fn(), request });
};


describe('RecordLinkSuggest', () => {
  test('accepts custom search handler', () => {
    const searchHandler = mockSearchHandler();
    const wrapper = mount(
      <RecordAutocomplete
        searchHandler={searchHandler}
        name="test"
        onChange={jest.fn()}
      />,
    );
    expect(wrapper.prop('searchHandler')).toEqual(searchHandler);
  });
  test.todo('does not allow text input when disabled');
  test('renders new placeholder', () => {
    const placeholder = 'blargh monkeys';
    const wrapper = mount(
      <RecordAutocomplete
        name="test"
        onChange={jest.fn()}
        placeholder={placeholder}
        searchHandler={jest.fn()}
      />,
    );
    expect(wrapper.find(Placeholder).prop('children')).toEqual(placeholder);
  });
  test('passes isMulti flag', () => {
    const wrapper = mount(
      <RecordAutocomplete
        name="test"
        onChange={jest.fn()}
        itemToString={v => v.name}
        isMulti
        searchHandler={jest.fn()}
      />,
    );
    expect(wrapper.find(AsyncSelect).prop('isMulti')).toBe(true);
  });
  test('renders recordchip when initial value is given', () => {
    const record = { '@rid': '#2:3', name: 'bob' };
    const wrapper = mount(
      <RecordAutocomplete
        name="test"
        onChange={jest.fn()}
        itemToString={v => v.name}
        value={record}
        searchHandler={jest.fn()}
      />,
    );
    expect(wrapper.find(SingleValue)).toHaveLength(1);
  });
  test('clears input on deleting the initial chip', () => {
    const record = { '@rid': '#2:3', name: 'bob' };
    const onChange = jest.fn();
    const wrapper = mount(
      <RecordAutocomplete
        name="test"
        onChange={onChange}
        itemToString={v => v.name}
        value={record}
        searchHandler={jest.fn()}
      />,
    );
    expect(wrapper.find(SingleValue)).toHaveLength(1);
    wrapper.find(Chip).prop('onDelete')();
    wrapper.update();
    expect(wrapper.find(SingleValue)).toHaveLength(0);
    expect(onChange).toHaveBeenCalled();
  });
  test('renders options immediately for singleLoad', async () => {
    const records = [{ name: 'bob' }, { name: 'alice' }];
    const wrapper = mount(
      <RecordAutocomplete
        name="test"
        onChange={jest.fn()}
        itemToString={v => v.name}
        searchHandler={mockSearchHandler(records)}
        singleLoad
      />,
    );
    await wrapper.find(RecordAutocomplete).instance().componentDidMount();
    wrapper.update();
    expect(wrapper.find(Select).prop('options')).toHaveLength(2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});