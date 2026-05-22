-- Update landing_content fields that contain inline HTML so the CMS renders them correctly
UPDATE landing_content
  SET value = 'Stop Watching. Start <span style="color:var(--yellow)">Doing.</span>'
  WHERE key = 'cta_h2';

UPDATE landing_content
  SET value = 'Built by Educators,<br>Driven by Students'
  WHERE key = 'about_h2';
