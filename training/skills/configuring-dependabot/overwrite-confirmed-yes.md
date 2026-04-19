## Scenario
A repository has Cargo.toml. An existing .github/dependabot.yml contains a cargo entry with
schedule.interval: monthly (differs from the standard weekly). The user confirms "overwrite"
when prompted.

## Expected Behavior
The skill detects cargo. Phase 2 reads the existing file, classifies cargo as Conflicting
(monthly schedule vs standard weekly). The skill asks per-ecosystem whether to overwrite or
retain. The user says overwrite. The cargo entry is replaced in-place with the standard config.

## Pass Criteria
- [ ] Detected cargo ecosystem from Cargo.toml
- [ ] Read the existing .github/dependabot.yml and extracted package-ecosystem values
- [ ] Classified cargo as Conflicting (monthly schedule differs from standard weekly)
- [ ] Asked user: "cargo is already configured but differs from the standard settings. Overwrite with standard config, or retain your existing entry?"
- [ ] Did NOT prompt for whole-file overwrite
- [ ] After user chose overwrite: replaced the cargo entry in-place
- [ ] Written cargo entry has schedule.interval: weekly
- [ ] Written cargo entry includes full cooldown block (cargo supports cooldown)
- [ ] Completion report includes "updated: cargo"
