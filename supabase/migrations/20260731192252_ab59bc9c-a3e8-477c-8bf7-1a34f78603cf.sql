UPDATE public.profiles SET avatar_url = CASE
  WHEN avatar_url LIKE '%Badboy.png' THEN '/__l5e/assets-v1/1e579d2c-8ff1-4f5c-accc-8dbfb8064245/Badboy.svg'
  WHEN avatar_url LIKE '%Beutiful.png' THEN '/__l5e/assets-v1/539b87f4-adf1-4093-82da-dbf613868647/Beutiful.svg'
  WHEN avatar_url LIKE '%Cool.png' THEN '/__l5e/assets-v1/a1ae73ad-73f2-46bd-904f-59b28cc8aec5/Cool.svg'
  WHEN avatar_url LIKE '%Cubby.png' THEN '/__l5e/assets-v1/8688a5a3-0427-450d-8e37-9e2d07868c86/Cubby.svg'
  WHEN avatar_url LIKE '%Diliggent.png' THEN '/__l5e/assets-v1/5e6627fa-1a73-4af0-83fd-5cb209971bc1/Diliggent.svg'
  WHEN avatar_url LIKE '%Hijab.png' THEN '/__l5e/assets-v1/136c203e-3f09-4800-8c4d-4f440e73997a/Hijab.svg'
  ELSE avatar_url END
WHERE avatar_url LIKE '/__l5e/assets-v1/%';