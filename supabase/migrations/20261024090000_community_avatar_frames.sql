-- Profile frames: the ring drawn around a member's avatar (community "แต่งโปรไฟล์").
-- Every frame is free for now; unlocking by check-in streak can come later as its own table.

alter table community.profiles
  add column avatar_frame text not null default 'classic'
    check (avatar_frame in ('classic', 'lavender', 'rosegold', 'aurora', 'ocean', 'mono'));

comment on column community.profiles.avatar_frame is
  'ring around the avatar; the owner picks it (column grant below), everyone who can see the profile sees it';

-- column-level grant, like the other editable profile fields: role stays out of reach
grant update (avatar_frame) on community.profiles to authenticated;
