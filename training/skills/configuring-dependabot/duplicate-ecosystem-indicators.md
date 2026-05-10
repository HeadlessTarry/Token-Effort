## Scenario
A repository contains both requirements.txt AND pyproject.toml at the root, plus a Gemfile
AND a .gemspec file. No .github/workflows/ exists. No .github/dependabot.yml exists.

## Expected Behavior
Both pip indicators (requirements.txt, pyproject.toml) map to the same "pip" ecosystem.
Both bundler indicators (Gemfile, *.gemspec) map to the same "bundler" ecosystem.
The skill deduplicates and writes exactly one pip entry and one bundler entry — not two of each.

## Pass Criteria
- [ ] Detected pip ecosystem (from either requirements.txt or pyproject.toml)
- [ ] Detected bundler ecosystem (from either Gemfile or *.gemspec)
- [ ] Wrote .github/dependabot.yml with exactly two entries (pip and bundler)
- [ ] Did NOT write duplicate pip or bundler entries
- [ ] Both entries include schedule.interval: weekly and cooldown block
- [ ] Reported pip and bundler in completion message
