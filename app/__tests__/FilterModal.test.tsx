/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {DEFAULT_FILTERS, FilterModal} from '../src/components/FilterModal';
import {propertiesApi} from '../src/api/client';

const {act} = ReactTestRenderer;

async function renderModal() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <FilterModal visible onClose={jest.fn()} filters={DEFAULT_FILTERS} onApply={jest.fn()} />,
    );
  });
  return JSON.stringify(renderer.toJSON());
}

afterEach(() => jest.restoreAllMocks());

test('offers the cities that have listings', async () => {
  jest.spyOn(propertiesApi, 'cities').mockResolvedValue({cities: ['Bengaluru', 'Hyderabad']});
  const page = await renderModal();

  expect(page).toContain('Hyderabad');
  expect(page).not.toContain('New York');
});

test('still opens when the cities cannot be loaded', async () => {
  jest.spyOn(propertiesApi, 'cities').mockRejectedValue(new Error('Network down'));
  const page = await renderModal();

  expect(page).toContain('Price Range');
  expect(page).toContain('₹50L');
});
