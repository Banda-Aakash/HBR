/**
 * @format
 */

import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {parse} from 'react-native-svg';
import {ThemeProvider, useTheme} from '../src/context/ThemeContext';
import {festiveApi} from '../src/api/client';
import {FESTIVALS} from '../src/theme';
import {FESTIVE_ART} from '../src/theme/festiveArt';

const {act} = ReactTestRenderer;

const Shows = () => <Text>{useTheme().festival ?? 'everyday'}</Text>;

async function shownFestival() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<ThemeProvider><Shows /></ThemeProvider>);
  });
  return renderer.root.findByType(Text).props.children;
}

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
  jest.useFakeTimers({
    now: new Date('2026-11-06T06:00:00Z'),
    doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
  });
});

afterEach(() => {
  jest.useRealTimers();
});

test('uses the festival the server names', async () => {
  jest.spyOn(festiveApi, 'current').mockResolvedValue({festival: 'diwali', endsOn: '2026-11-11'});

  expect(await shownFestival()).toBe('diwali');
});

test('stays on the everyday look when nothing is on', async () => {
  jest.spyOn(festiveApi, 'current').mockResolvedValue({festival: null, endsOn: null});

  expect(await shownFestival()).toBe('everyday');
});

test('ignores a festival this version of the app has no artwork for', async () => {
  jest.spyOn(festiveApi, 'current').mockResolvedValue({festival: 'lohri', endsOn: '2026-11-11'});

  expect(await shownFestival()).toBe('everyday');
});

test('keeps a known festival going when offline, but not past its end', async () => {
  jest.spyOn(festiveApi, 'current').mockRejectedValue(new Error('offline'));

  await AsyncStorage.setItem('@realapp_festival', JSON.stringify({id: 'diwali', endsOn: '2026-11-11'}));
  expect(await shownFestival()).toBe('diwali');

  await AsyncStorage.setItem('@realapp_festival', JSON.stringify({id: 'diwali', endsOn: '2026-11-05'}));
  expect(await shownFestival()).toBe('everyday');
});

test('every festival has artwork the app can draw', () => {
  expect(Object.keys(FESTIVALS).sort()).toEqual(Object.keys(FESTIVE_ART).sort());

  Object.values(FESTIVE_ART).forEach(art => {
    expect(parse(art.top)).not.toBeNull();
    expect(parse(art.scene)).not.toBeNull();
  });
});
