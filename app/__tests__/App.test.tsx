/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {FEATURES} from '../src/config';

const renderedText = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  JSON.stringify(renderer.toJSON());

test('renders the login screen when signed out', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  expect(renderedText(renderer)).toContain('Welcome back');
});

test('hides login options that are not ready', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  const text = renderedText(renderer);
  expect(FEATURES.socialLogin).toBe(false);
  expect(text).not.toContain('Google');
  expect(text).not.toContain('Forgot?');
});
