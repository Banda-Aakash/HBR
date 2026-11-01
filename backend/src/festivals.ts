export interface FestivalDates {
  id: string;
  from: string;
  to: string;
}

// When the app wears each festival's theme, in India time. Windows run a few days around the
// day itself, so a calendar that differs by a day is still covered. Festivals that fall together
// share the days between them. Add each new year here, and check the Eid dates against the moon
// sighting. FESTIVE_THEME overrides all of this without a release: an id from this list, or "none".
export const FESTIVAL_DATES: FestivalDates[] = [
  {id: 'diwali', from: '2026-11-05', to: '2026-11-11'},
  {id: 'christmas', from: '2026-12-20', to: '2026-12-26'},
  {id: 'pongal', from: '2027-01-13', to: '2027-01-16'},
  {id: 'eid', from: '2027-03-08', to: '2027-03-11'},
  {id: 'holi', from: '2027-03-19', to: '2027-03-22'},
  {id: 'ugadi', from: '2027-04-05', to: '2027-04-08'},
  {id: 'baisakhi', from: '2027-04-12', to: '2027-04-14'},
  {id: 'bihu', from: '2027-04-15', to: '2027-04-17'},
  {id: 'eid', from: '2027-05-15', to: '2027-05-18'},
  {id: 'national', from: '2027-08-13', to: '2027-08-15'},
  {id: 'rakhi', from: '2027-08-16', to: '2027-08-17'},
  {id: 'janmashtami', from: '2027-08-22', to: '2027-08-25'},
  {id: 'ganesh', from: '2027-09-02', to: '2027-09-05'},
  {id: 'onam', from: '2027-09-09', to: '2027-09-13'},
  {id: 'bathukamma', from: '2027-09-29', to: '2027-10-01'},
  {id: 'navratri', from: '2027-10-02', to: '2027-10-04'},
  {id: 'durga', from: '2027-10-05', to: '2027-10-09'},
  {id: 'diwali', from: '2027-10-25', to: '2027-10-30'},
  {id: 'christmas', from: '2027-12-20', to: '2027-12-26'},
];

const FESTIVAL_IDS = new Set(FESTIVAL_DATES.map(f => f.id));

// An override has no end date of its own, so the app is told to check back tomorrow
const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

export function todayInIndia(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Kolkata'}).format(now);
}

export function currentFestival(today: string, override?: string) {
  if (override === 'none') {
    return {festival: null, endsOn: null};
  }
  if (override && FESTIVAL_IDS.has(override)) {
    return {festival: override, endsOn: addDays(today, 1)};
  }
  const running = FESTIVAL_DATES.find(f => f.from <= today && today <= f.to);
  return running ? {festival: running.id, endsOn: running.to} : {festival: null, endsOn: null};
}
