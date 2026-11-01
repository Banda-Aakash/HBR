/**
 * @format
 */

import React from 'react';
import {Alert} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {HomeScreen} from '../src/screens/HomeScreen';
import {AuthProvider} from '../src/context/AuthContext';
import {ThemeContext as FestivalContext} from '../src/context/ThemeContext';
import {FESTIVALS} from '../src/theme';
import {propertiesApi} from '../src/api/client';

const {act} = ReactTestRenderer;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: jest.fn()}),
}));

const home = (id: string, title: string) => ({
  id,
  title,
  type: 'house',
  images: ['x.jpg'],
  price: 4500000,
  priceUnit: 'total',
  rating: 4,
  reviewCount: 1,
  address: 'x',
  city: 'x',
  state: 'x',
  bedrooms: 2,
  bathrooms: 2,
  area: 900,
});

const page = (properties: unknown[], hasMore = false) => ({
  count: properties.length,
  total: properties.length,
  hasMore,
  properties,
});

async function renderHome() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>,
    );
  });
  return renderer;
}

async function press(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const text = renderer.root.findAll(
    node => (node.type as unknown) === 'Text' && node.props.children === label,
  )[0];
  let target: ReactTestRenderer.ReactTestInstance | null = text;
  while (target && !target.props.onPress) {
    target = target.parent;
  }
  await act(async () => {
    target!.props.onPress();
  });
}

const texts = (renderer: ReactTestRenderer.ReactTestRenderer) => JSON.stringify(renderer.toJSON());

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

test('shows an error and recovers on retry', async () => {
  const list = jest.spyOn(propertiesApi, 'list').mockRejectedValue(new Error("Can't reach the server."));
  const renderer = await renderHome();
  expect(texts(renderer)).toContain("Can't reach the server.");
  expect(texts(renderer)).not.toContain('No properties match');

  list.mockImplementation(params =>
    Promise.resolve(page(params?.featured ? [] : [home('h1', 'Lake View')]) as any),
  );
  await press(renderer, 'Try Again');

  expect(texts(renderer)).toContain('Lake View');
  expect(texts(renderer)).not.toContain("Can't reach the server.");
});

test('shows prices in rupees', async () => {
  jest.spyOn(propertiesApi, 'list').mockResolvedValue(page([home('h1', 'Lake View')]) as any);
  const renderer = await renderHome();

  expect(texts(renderer)).toContain('₹45 L');
  expect(texts(renderer)).not.toContain('$');
});

test('leaves out the rating until a listing has reviews', async () => {
  const unreviewed = {...home('h1', 'Lake View'), rating: 0, reviewCount: 0};
  jest.spyOn(propertiesApi, 'list').mockResolvedValue(page([unreviewed]) as any);
  const renderer = await renderHome();

  expect(texts(renderer)).toContain('Lake View');
  expect(texts(renderer)).not.toContain('(0)');
});

test('hides the Featured section when nothing is featured', async () => {
  jest.spyOn(propertiesApi, 'list').mockResolvedValue(page([]) as any);
  const renderer = await renderHome();

  expect(texts(renderer)).not.toContain('Featured homes');
});

test('a BHK chip filters by bedrooms and Villas by type', async () => {
  const list = jest.spyOn(propertiesApi, 'list').mockResolvedValue(page([home('h1', 'Lake View')]) as any);
  const renderer = await renderHome();

  await press(renderer, '2 BHK');
  expect(list).toHaveBeenLastCalledWith(expect.objectContaining({bedrooms: 2, page: 1}));

  await press(renderer, 'Villas');
  expect(list).toHaveBeenLastCalledWith(expect.objectContaining({type: 'villa', bedrooms: undefined}));
});

test('wears the festival when one is on', async () => {
  jest.spyOn(propertiesApi, 'list').mockResolvedValue(page([]) as any);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <FestivalContext value={FESTIVALS.diwali}>
        <HomeScreen />
      </FestivalContext>,
    );
  });

  expect(texts(renderer)).toContain('Happy Diwali');
  expect(texts(renderer)).not.toContain('cross a bridge');
});

test('loads the next page onto the end of the list', async () => {
  const list = jest.spyOn(propertiesApi, 'list').mockImplementation(params => {
    if (params?.featured) {return Promise.resolve(page([]) as any);}
    return Promise.resolve(
      (params?.page === 2 ? page([home('h2', 'Hill View')]) : page([home('h1', 'Lake View')], true)) as any,
    );
  });
  const renderer = await renderHome();
  expect(texts(renderer)).not.toContain('Hill View');

  await press(renderer, 'Load More');

  expect(list).toHaveBeenCalledWith(expect.objectContaining({page: 2}));
  expect(texts(renderer)).toContain('Lake View');
  expect(texts(renderer)).toContain('Hill View');
  expect(texts(renderer)).not.toContain('Load More');
});

test('keeps the list when the next page fails', async () => {
  jest.spyOn(propertiesApi, 'list').mockImplementation(params => {
    if (params?.page === 2) {return Promise.reject(new Error('Network down'));}
    return Promise.resolve(page(params?.featured ? [] : [home('h1', 'Lake View')], !params?.featured) as any);
  });
  const renderer = await renderHome();

  await press(renderer, 'Load More');

  expect(Alert.alert).toHaveBeenCalledWith('Could Not Load More', 'Network down');
  expect(texts(renderer)).toContain('Lake View');
});
