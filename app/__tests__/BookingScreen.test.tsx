/**
 * @format
 */

import React from 'react';
import {Alert, Linking} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {BookingScreen} from '../src/screens/BookingScreen';
import {BookingConfirmationScreen} from '../src/screens/BookingConfirmationScreen';
import {RoleProvider} from '../src/context/RoleContext';
import {bookingsApi, propertiesApi} from '../src/api/client';

const {act} = ReactTestRenderer;

const property = {id: 'p1', title: 'Lake View', city: 'Hyderabad', state: 'TS', images: ['x.jpg']};
const booking = {
  id: 'clx1234567890abcd',
  propertyId: 'p1',
  userId: 'u1',
  date: '2026-11-04',
  time: '10:00 AM',
  status: 'pending',
  notes: '',
  createdAt: '2026-11-03T00:00:00Z',
};

const navigation = {replace: jest.fn(), goBack: jest.fn(), navigate: jest.fn()};
const texts = (renderer: ReactTestRenderer.ReactTestRenderer) => JSON.stringify(renderer.toJSON());

async function press(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const text = renderer.root.findAll(
    node => (node.type as unknown) === 'Text' && String(node.props.children) === label,
  )[0];
  let target: ReactTestRenderer.ReactTestInstance | null = text;
  while (target && !target.props.onPress) {
    target = target.parent;
  }
  await act(async () => {
    target!.props.onPress();
  });
}

async function renderScreen() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <RoleProvider>
        <BookingScreen
          navigation={navigation as any}
          route={{key: 'k', name: 'BookingScreen', params: {propertyId: 'p1'}}}
        />
      </RoleProvider>,
    );
  });
  return renderer;
}

async function requestVisit() {
  const renderer = await renderScreen();
  await press(renderer, '4'); // Tomorrow, 4 November
  await press(renderer, '10:00 AM');
  await press(renderer, 'Send request');
  return renderer;
}

beforeEach(() => {
  jest.clearAllMocks();
  // 2:00 am on 3 November in India, when UTC is still on 2 November
  jest.useFakeTimers({
    now: new Date('2026-11-02T20:30:00Z'),
    doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
  });
  jest.spyOn(propertiesApi, 'getById').mockResolvedValue(property as any);
  jest.spyOn(bookingsApi, 'create').mockResolvedValue({booking, property} as any);
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('sends the day the user tapped, even early in the morning', async () => {
  await requestVisit();

  expect(bookingsApi.create).toHaveBeenCalledWith('p1', '2026-11-04', '10:00 AM', '', 'owner');
  expect(navigation.replace).toHaveBeenCalledWith('BookingConfirmation', {
    booking: expect.objectContaining({status: 'pending'}),
  });
});

test('tells the business through WhatsApp that this is a request', async () => {
  await requestVisit();
  await act(async () => {
    jest.advanceTimersByTime(500);
  });

  const url = decodeURIComponent((Linking.openURL as jest.Mock).mock.calls[0][0]);
  expect(url).toContain('New Visit Request');
  expect(url).not.toContain('Confirmed');
  expect(url).toContain('Wednesday, November 4, 2026');
});

test('warns the user when WhatsApp cannot be opened', async () => {
  (Linking.openURL as jest.Mock).mockRejectedValue(new Error('no app'));
  await requestVisit();
  await act(async () => {
    jest.advanceTimersByTime(500);
  });

  expect(Alert.alert).toHaveBeenCalledWith(
    'Could Not Open WhatsApp',
    expect.stringContaining('7890ABCD'),
  );
});

test('stays on the screen when the server refuses the slot', async () => {
  (bookingsApi.create as jest.Mock).mockRejectedValue(
    new Error('You already have a visit booked for this time'),
  );
  await requestVisit();

  expect(Alert.alert).toHaveBeenCalledWith('Error', 'You already have a visit booked for this time');
  expect(navigation.replace).not.toHaveBeenCalled();
});

test('offers a retry when the property cannot be loaded', async () => {
  (propertiesApi.getById as jest.Mock).mockRejectedValueOnce(new Error("Can't reach the server."));
  const renderer = await renderScreen();
  expect(texts(renderer)).toContain("Can't reach the server.");

  await press(renderer, 'Try Again');
  expect(texts(renderer)).toContain('Lake View');
});

test('the confirmation page says requested, not confirmed', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <BookingConfirmationScreen
        navigation={navigation as any}
        route={{key: 'k', name: 'BookingConfirmation', params: {booking: booking as any}}}
      />,
    );
  });

  const page = texts(renderer);
  expect(page).toContain('Visit requested');
  expect(page).toContain('Wed 4 Nov');
  expect(page).not.toContain('Confirmed');
});
