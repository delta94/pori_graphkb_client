import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import GraphLegend from '../GraphComponent/GraphLegend/GraphLegend';
import { PropsMap } from '../GraphComponent/kbgraph';

describe('<GraphLegend />', () => {
  it('does not crash', () => {
    const handleGraphOptionsChange = jest.fn();
    const wrapper = mount(
      <GraphLegend
        graphOptions={{
          nodesLegend: true,
          nodesColor: true,
          linksColor: true,
          linksLegend: true,
          nodesColors: { color1: 'white' },
          linksColors: { color2: 'black' },
        }}
        propsMap={new PropsMap()}
        handleGraphOptionsChange={handleGraphOptionsChange}
        disabled={false}
      />,
    );

    wrapper.find('button[name="nodesLegend"]').simulate('click');
    expect(handleGraphOptionsChange.mock.calls.length).to.eq(1);

    wrapper.find('button[name="linksLegend"]').simulate('click');
    expect(handleGraphOptionsChange.mock.calls.length).to.eq(2);
  });
});