## Scenario
User is running the migration flow. The repository contains Superpowers artifacts: .superpowers/, docs/superpowers/, install.sh, vendor.json.

## Expected Behavior
Step 1 scans for Superpowers artifacts and prints a Migration Analysis report listing which artifacts were found.

## Pass Criteria
- [ ] Skill scans for: .superpowers/, docs/superpowers/, docs/decisions/, install scripts, vendor.json, lib/, triaging workflow
- [ ] Skill prints a Migration Analysis report
- [ ] Report shows status (present/not found) for each artifact type
- [ ] Report correctly identifies .superpowers/ as present
- [ ] Report correctly identifies docs/superpowers/ as present
- [ ] Report correctly identifies install.sh as present
- [ ] Report correctly identifies vendor.json as present
