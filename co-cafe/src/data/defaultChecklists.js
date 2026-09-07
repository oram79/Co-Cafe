// Default opening / closing task lists.
// These are the authoritative checklists — the Guidebook UI is view + tick only.
// To change a task, edit this file and deploy. Kept intentionally short:
// one clear line each, with just enough detail to remove guesswork.

export const DEFAULT_CHECKLISTS = {
  open: [
    { id: 'open-1',  text: 'Clock in on phone', done: false },
    { id: 'open-2',  text: 'Turn on music speaker', done: false },
    { id: 'open-3',  text: 'Turn on espresso machine & grinders (let them heat up)', done: false },
    { id: 'open-4',  text: 'Turn on dishwasher', done: false },
    { id: 'open-5',  text: 'Start drip coffee pot (150g ground)', done: false },
    { id: 'open-6',  text: 'Put out ice water, cream & milk', done: false },
    { id: 'open-7',  text: 'Log fridge & freezer temps', done: false },
    { id: 'open-8',  text: 'Expiry date check', done: false },
    { id: 'open-9',  text: 'Put out all bakery items in the display case', done: false },
    { id: 'open-10', text: 'Turn on cafe lights & open sign (8am)', done: false },
    { id: 'open-11', text: 'Start soup at 11:15', done: false },
  ],
  close: [
    { id: 'close-1',  text: 'Clean & backflush the espresso machine', done: false },
    { id: 'close-2',  text: 'Wipe down the coffee grinder area', done: false },
    { id: 'close-3',  text: 'Wash & put away all dishes', done: false },
    { id: 'close-4',  text: 'Brush out the drip coffee grinder', done: false },
    { id: 'close-5',  text: 'Wipe counters & tables with sanitizer', done: false },
    { id: 'close-6',  text: 'Wipe down inside bakery displays & toaster oven', done: false },
    { id: 'close-7',  text: 'Wipe down cup holders (water & take-out)', done: false },
    { id: 'close-8',  text: 'Clean microwave', done: false },
    { id: 'close-9',  text: 'Take out garbage & recycling', done: false },
    { id: 'close-10', text: 'Put away leftover bakery treats', done: false },
    { id: 'close-11', text: 'Rinse & water down the coffee pots', done: false },
    { id: 'close-12', text: 'Turn off espresso machine & grinders', done: false },
    { id: 'close-13', text: 'Turn off dishwasher', done: false },
    { id: 'close-14', text: 'Shut down laptop & plug in the POS to charge', done: false },
    { id: 'close-15', text: 'Turn off cafe lights & open sign', done: false },
    { id: 'close-16', text: 'Sweep & mop all floors', done: false },
    { id: 'close-17', text: 'Turn off the music speaker', done: false },
    { id: 'close-18', text: 'Clock out on phone', done: false },
  ],
}
