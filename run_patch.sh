#!/bin/bash
sed -i.bak 's/export function __test_setCalendarLinked(val, mock) { isCalendarLinked = val; if (mock) ExpoCalendar = mock; }/\/\/ @ts-ignore\nexport function __test_setCalendarLinked(val, mock) { isCalendarLinked = val; if (mock) ExpoCalendar = mock; }/g' hooks/useCalendarSync.native.ts
