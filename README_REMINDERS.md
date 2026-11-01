# Native reminders integration

The native reminder bridge supports scheduling local notifications from the WebView layer.

## Key classes
- ReminderBridge — JS interface
- ReminderScheduler — AlarmManager scheduling
- ReminderReceiver — broadcast handling
- ReminderSchedule — data model

## Permissions
- SCHEDULE_EXACT_ALARM
- POST_NOTIFICATIONS
- RECEIVE_BOOT_COMPLETED

See VALIDATION.md for test checklist.
