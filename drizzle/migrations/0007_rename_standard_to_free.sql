-- Rename the legacy "standard" plan value to "free"
UPDATE user_profiles SET plan = 'free' WHERE plan = 'standard';
