import React from 'react';
import { mount } from 'enzyme';
import { Dialog } from '@material-ui/core';
import GraphOptionsPanel from '../GraphComponent/GraphOptionsPanel/GraphOptionsPanel';
import { PropsMap, GraphOptions } from '../GraphComponent/kbgraph';

describe('<GraphOptionsPanel />', () => {
  let wrapper;
  const testNodes = [
    { name: 'hello', source: { name: 'test source' } },
    { name: 'goodbye', sourceId: 'test source ID' },
  ];

  const handleHelpOpenSpy = jest.spyOn(GraphOptionsPanel.prototype, 'handleHelpOpen');
  const handleHelpCloseSpy = jest.spyOn(GraphOptionsPanel.prototype, 'handleHelpClose');

  it('renders md dialog as first child', () => {
    const propsMap = new PropsMap();
    testNodes.forEach(t => propsMap.loadNode(t));
    wrapper = mount(
      <GraphOptionsPanel
        graphOptionsOpen
        graphOptions={new GraphOptions()}
        propsMap={propsMap}
        linkLegendDisabled={false}
        handleDialogClose={() => { }}
        handleGraphOptionsChange={() => { }}
      />,
    );
    expect(wrapper.children().first().type()).toBe(Dialog);
  });

  it('passes on open prop to child dialog', () => {
    wrapper = mount(
      <GraphOptionsPanel
        graphOptionsOpen={false}
        graphOptions={new GraphOptions()}
        propsMap={new PropsMap()}
        linkLegendDisabled={false}
        handleDialogClose={jest.fn()}
        handleGraphOptionsChange={jest.fn()}
      />,
    );
    wrapper.children().forEach((child) => {
      expect(child.type()).toBe(Dialog);
      expect(child.children().props().open).toBe(false);
    });
  });

  it('triggers the handler when dialog closes', () => {
    const handleDialogClose = jest.fn();
    const handleGraphOptionsChange = jest.fn();
    wrapper = mount(
      <GraphOptionsPanel
        graphOptionsOpen
        graphOptions={new GraphOptions()}
        propsMap={new PropsMap()}
        linkLegendDisabled={false}
        handleDialogClose={handleDialogClose}
        handleGraphOptionsChange={handleGraphOptionsChange}
      />,
    );
    wrapper.find('button#options-close-btn').simulate('click');
    expect(handleDialogClose.mock.calls.length).toBe(2);
  });

  it('opens and renders help dialog when help buttons are clicked', () => {
    wrapper = mount(
      <GraphOptionsPanel
        graphOptionsOpen
        graphOptions={new GraphOptions()}
        propsMap={new PropsMap()}
        linkLegendDisabled={false}
        handleDialogClose={() => { }}
        handleGraphOptionsChange={() => { }}
      />,
    );
    wrapper.find('.options-title button#main-help-btn').simulate('click');
    expect(wrapper.children().length).toBe(2);
    wrapper.find('.help-title button').simulate('click');

    wrapper.find('.options-title button#advanced-help-btn').simulate('click');
    expect(wrapper.children().length).toBe(2);
    wrapper.find('.help-title button').simulate('click');

    expect(handleHelpOpenSpy).toHaveBeenCalledTimes(2);
    expect(handleHelpCloseSpy).toHaveBeenCalledTimes(2);
  });

  it('advanced options changes are triggered', () => {
    const handleGraphOptionsChange = jest.fn();
    wrapper = mount(
      <GraphOptionsPanel
        graphOptionsOpen
        graphOptions={new GraphOptions()}
        propsMap={new PropsMap()}
        linkLegendDisabled={false}
        handleDialogClose={() => { }}
        handleGraphOptionsChange={handleGraphOptionsChange}
      />,
    );
    wrapper.find('div.advanced-options-wrapper input')
      .forEach(input => input.simulate('change'));

    wrapper.find('div.main-options-wrapper input')
      .forEach(input => input.simulate('change'));

    expect(handleGraphOptionsChange.mock.calls.length).toBeGreaterThan(0);
  });
});