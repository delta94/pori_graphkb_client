import { mount, shallow } from 'enzyme';
import React from 'react';

import GraphNodeDisplay from '../GraphComponent/GraphNodeDisplay/GraphNodeDisplay';
import { GraphNode } from '../GraphComponent/kbgraph';

const mockData = new GraphNode(
  {
    '@rid': '#1',
    name: 'node',
    source: {
      name: 'node source',
    },
  },
  0,
  0,
);

describe('<GraphNodeDisplay />', () => {
  let wrapper;

  test('renders children correctly', () => {
    wrapper = shallow(
      <GraphNodeDisplay
        node={mockData}
      />,
    );
    expect(wrapper.type()).toBe('g');
    expect(wrapper.children().first().type()).toBe('text');
  });

  test('renders correct label', () => {
    wrapper = shallow(
      <GraphNodeDisplay
        labelKey="name"
        node={mockData}
      />,
    );
    expect(wrapper.type()).toBe('g');
    expect(wrapper.children('text').text()).toBe('node');
  });

  test('mutes node if not selected for detail viewing', () => {
    const detail = { '@rid': '#2' };
    wrapper = shallow(
      <GraphNodeDisplay
        actionsNode={{ data: detail }}
        detail={detail}
        labelKey="source.name"
        node={mockData}
      />,
    );

    expect(wrapper.find('circle.node').props().style.opacity).toBe(0.6);
  });

  test('does not render invalid node', () => {
    wrapper = shallow(
      <GraphNodeDisplay
        detail={mockData}
        labelKey="source.name"
        node={null}
      />,
    );
    expect(wrapper.find('circle.node')).toHaveLength(0);
    wrapper.unmount();
  });

  test('successfully applies drag function to node (doesn\'t test triggering)', () => {
    const applyDrag = jest.fn();
    wrapper = mount(
      <GraphNodeDisplay
        applyDrag={applyDrag}
        labelKey="source.name"
        node={mockData}
      />,
    );
    expect(applyDrag.mock.calls.length).toBe(0);
    wrapper.find('g').first().simulate('drag');
    wrapper.find('g').first().simulate('dragstart');
  });
});
