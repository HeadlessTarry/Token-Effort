## Scenario
The user selects "2" (superpowers recommendation). The user replies "yes" when asked
if they have installed the superpowers plugin.

## Expected Behavior
Step 2 prints the recommendation, asks the question, receives "yes", and notes
"Superpowers plugin: confirmed installed" in the summary. The skill does not block
or require any action beyond the confirmation.

## Pass Criteria
- [ ] Printed the superpowers install recommendation text
- [ ] Included the https://github.com/obra/superpowers URL in the recommendation
- [ ] Asked "Have you installed the superpowers plugin (or do you already have it)?"
- [ ] Noted "confirmed installed" (or equivalent) in the completion summary
- [ ] Did NOT block or require further action from the user
