-- Two more reading topics: study and health (the app's topic list, apps/tarot/src/lib/reading.ts).
alter table tarot.readings drop constraint readings_topic_check;
alter table tarot.readings add constraint readings_topic_check
  check (topic in ('general', 'love', 'work', 'money', 'study', 'health'));
