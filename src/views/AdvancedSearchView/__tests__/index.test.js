import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import {
  render, fireEvent,
} from '@testing-library/react';


import AdvancedSearchView from '..';

jest.mock('@/components/RecordAutocomplete', () => (({
  value, onChange, name, label,
}) => {
  const handleChange = () => {
    onChange({ target: { value: [{ displayName: 'value', '@rid': '1:1' }] }, name });
  };

  return (
    <select data-testid="value-select" value={value} onChange={handleChange}>
      <option key="test" value={value}>
        {label}
      </option>
    </select>
  );
}));

jest.mock('@/components/ResourceSelectComponent', () => (({
  resources = [], value, onChange, className,
}) => {
  const handleChange = (event) => {
    const option = resources.find(
      opt => opt.value === event.currentTarget.value,
    );
    onChange({ target: { value: option ? option.value : option } });
  };

  const classCheck = className.includes('class') ? 'class' : null;
  const propCheck = className.includes('property') ? 'prop' : null;
  const operatorCheck = className.includes('operator') ? 'operator' : null;
  const selectType = classCheck || propCheck || operatorCheck || 'filter';
  return (
    <select data-testid={`${selectType}-select`} value={value} onChange={handleChange}>
      {resources.map(opt => (
        <option key={opt.key} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}));

describe('AdvancedSearchView', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockPush = jest.fn();

  const mockHistory = {
    push: event => mockPush(event),
  };

  let getByTestId;
  let getByText;

  beforeEach(() => {
    ({
      getByTestId, getByText,
    } = render(
      <AdvancedSearchView
        history={mockHistory}
        modelName="Statement"
      />,
    ));
  });

  test('add filter button is disabled on render', async () => {
    expect(getByText('ADD FILTER')).toBeInTheDocument();
    expect(getByText('ADD FILTER')).toBeDisabled();
  });

  test('search button fires correctly', () => {
    fireEvent.click(getByText('Search'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/data/table?complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQifQ%253D%253D&%40class=Statement');
  });


  test('renders new filter group correctly', async () => {
    await fireEvent.change(getByTestId('prop-select'), { target: { value: 'relevance' } });
    await fireEvent.change(getByTestId('value-select'), { target: { value: [{ displayName: 'value', '@rid': '1:1' }] } });

    expect(getByText('ADD FILTER')).toBeInTheDocument();
    expect(getByText('ADD FILTER')).not.toBeDisabled();
    await fireEvent.click(getByText('ADD FILTER'));
    expect(getByText('relevance = \'value (1:1)\'')).toBeInTheDocument();
  });

  test('fires new search correctly', async () => {
    await fireEvent.change(getByTestId('prop-select'), { target: { value: 'relevance' } });
    await fireEvent.change(getByTestId('value-select'), { target: { value: [{ displayName: 'value', '@rid': '1:1' }] } });
    await fireEvent.click(getByText('ADD FILTER'));
    fireEvent.click(getByText('Search'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/data/table?complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQiLCJmaWx0ZXJzIjp7Ik9SIjpbeyJBTkQiOlt7InJlbGV2YW5jZSI6IjE6MSIsIm9wZXJhdG9yIjoiPSJ9XX1dfX0%253D&%40class=Statement');
  });
});
