/**
 * @format
 */

import React from 'react';
import {Alert, Linking} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {PropertyDetailScreen} from '../src/screens/PropertyDetailScreen';
import {propertiesApi} from '../src/api/client';

const {act} = ReactTestRenderer;

// A listing the way staff enter it: no reviews and no agent photo
const listing = {
  id: 'p1',
  title: 'Lake View',
  description: 'Bright home',
  price: 4500000,
  priceUnit: 'total',
  type: 'apartment',
  status: 'available',
  bedrooms: 2,
  bathrooms: 2,
  area: 1200,
  areaUnit: 'sqft',
  address: '1 Lake Road',
  city: 'Hyderabad',
  state: 'Telangana',
  images: ['https://example.com/a.jpg'],
  amenities: ['Gym'],
  rating: 0,
  reviewCount: 0,
  yearBuilt: 2020,
  parkingSpaces: 1,
  agent: {id: 'a', name: 'Meera', avatar: '', phone: '98765 43210', email: '', rating: 0, propertiesCount: 0},
};

async function renderScreen(property: object) {
  jest.spyOn(propertiesApi, 'getById').mockResolvedValue(property as any);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <PropertyDetailScreen
        navigation={{goBack: jest.fn(), navigate: jest.fn()} as any}
        route={{key: 'k', name: 'PropertyDetail', params: {propertyId: 'p1'}}}
      />,
    );
  });
  return renderer;
}

const byLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.onPress)[0];

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

test('shows a new listing without made-up scores', async () => {
  const page = JSON.stringify((await renderScreen(listing)).toJSON());

  expect(page).toContain('Meera');
  expect(page).not.toContain('(0)');
  expect(page).not.toContain('★');
});

test('calls the agent', async () => {
  const renderer = await renderScreen(listing);
  await act(async () => {
    byLabel(renderer, 'Call Meera').props.onPress();
  });

  expect(Linking.openURL).toHaveBeenCalledWith('tel:9876543210');
});

test('adds India\'s country code to WhatsApp links', async () => {
  const renderer = await renderScreen(listing);
  await act(async () => {
    byLabel(renderer, 'Message Meera on WhatsApp').props.onPress();
  });

  expect(Linking.openURL).toHaveBeenCalledWith('https://wa.me/919876543210');
});

test('leaves out contact buttons when no phone was entered', async () => {
  const renderer = await renderScreen({...listing, agent: {...listing.agent, phone: ''}});

  expect(byLabel(renderer, 'Call Meera')).toBeUndefined();
});

test('leaves out the agent section when no agent was entered', async () => {
  const page = await renderScreen({...listing, agent: {...listing.agent, name: '', phone: ''}});

  expect(JSON.stringify(page.toJSON())).not.toContain('Listed by');
});
