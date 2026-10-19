/* Quiz content. Every quiz is 4 games and 7 points: myth or fact (4 random cards), then one point each for three more games.
   Banks come from the two PH handoffs. Items marked "review" still need clinical or source sign-off before launch. */
window.REBEL_CONTENT = {

  hypertension: {
    id: "hypertension",
    title: "Know your hypertension",
    when: "",
    lede: "Four quick games in about three minutes.",
    labels: [
      { max: 2, name: "Fresh Start", text: "Plenty here was new, and that's the point. Now you know what most people miss." },
      { max: 5, name: "Pressure Spotter", text: "You caught a lot of it. A few myths slipped through, and you now have the answers." },
      { max: 7, name: "Numbers Master", text: "You know your numbers. Pass it on to someone who doesn't." }
    ],
    program: { qr: "assets/qr-hypertension.svg", url: "https://rebel.typeform.com/Accenture?utm_source=OCT19BOOTH", name: "hypertension", abbr: "HP", label: "REBEL Hypertension Prevention Program" },
    qr: "assets/qr-score.svg",
    qrUrl: "https://rebel.typeform.com/to/MnuskhU7?typeform-source=qrcode-button",
    cta: {
      title: "Know your numbers early",
      text: "High blood pressure often goes unnoticed until it causes a stroke or heart disease. A quick check is the fastest way to know.",
      links: [
        { href: "https://rebel-eap.as.me/hp", title: "Book a REBEL hypertension consult", sub: "Talk it through with a health professional" }
      ]
    },
    myths: [
      { id: "feel", t: "You'll feel it when your blood pressure is high.", a: "myth",
        e: "Most people feel nothing. High blood pressure often goes unnoticed until it causes a stroke or heart disease." },
      { id: "young", t: "Only people over 60 get high blood pressure.", a: "myth",
        e: "It starts slowly, often in your 20s. Check it even if you feel fine." },
      { id: "heart", t: "Heart disease is the number one cause of death in the Philippines.", a: "fact",
        e: "PSA's provisional 2024 data put ischaemic heart disease first, at 19.4 percent of deaths. Stroke is third." },
      { id: "135", t: "A reading of 135/85 is normal.", a: "myth",
        e: "In the Philippine guideline it is borderline (120-139 over 80-89). Normal is under 120/80." },
      { id: "stopmeds", t: "Once your reading is normal, you can stop your medicine.", a: "myth",
        e: "Readings look normal because the medicine works. Ask your doctor before changing anything." },
      { id: "twodays", t: "One high reading means you have hypertension.", a: "myth",
        e: "Doctors usually confirm it on two separate days, and home monitoring helps." },
      { id: "konsulta", t: "PhilHealth's primary care package covers maintenance medicines for hypertension.", a: "fact",
        e: "Konsulta/YAKAP covers 75 essential medicines, including blood pressure drugs." }
    ],
    rounds: [
      { type: "myth", name: "Myth or fact", hint: "Four cards. Swipe each one, or use the arrow keys.", n: 4 },
      { type: "crowd", name: "Crowd check", hint: "Tap how many of the 10 you think have high blood pressure.",
        cfg: { key: "crowd", prompt: "10 Filipino adults. How many have high blood pressure?", full: 3, part: 1, accept: [3, 4],
               explain: "About 1 in 3 Filipino adults has high blood pressure.", fun: "3 or 4 counts as spot on." } },
      { type: "sort", name: "Sort the reading", hint: "Drag each reading into a bucket, or tap one and then tap a bucket.", need: 5,
        pool: {
          Normal: ["108/68", "112/70", "116/74", "118/76"],
          Borderline: ["122/80", "124/82", "130/84", "136/86", "138/88"],
          Hypertension: ["142/90", "144/92", "150/94", "152/96", "158/98"]
        },
        teach: "One high reading is not a diagnosis. Doctors confirm it on two separate days." },
      { type: "slider", name: "Asin budget", hint: "Drag the slider to a number of grams.",
        cfg: { key: "salt", prompt: "How much salt does the average Filipino adult eat per day?", min: 0, max: 20, step: 0.5, start: 5,
               unit: " g", ticks: [0, 5, 10, 15, 20], accept: [9, 12],
               good: "Right range", bad: "Not quite",
               explain: "About 10.3 g a day. The WHO limit is under 5 g, so that's about double.", fun: "Anywhere from 9 to 12 g counts." } }
    ]
  },

  diabetes: {
    id: "diabetes",
    title: "Know your diabetes",
    when: "World Diabetes Day, November 14",
    lede: "Four quick games in about three minutes.",
    labels: [
      { max: 2, name: "Fresh Start", text: "Plenty here was new, and that's the point. Now you know what most people miss." },
      { max: 5, name: "Sugar Sleuth", text: "You spotted a lot of it. A few myths slipped through, and you now have the answers." },
      { max: 7, name: "Glucose Genius", text: "You know your stuff. Pass it on to someone who doesn't." }
    ],
    program: { qr: "assets/qr-diabetes.svg", url: "https://rebel.typeform.com/acndiabetes?utm_source=OCT19BOOTH", name: "diabetes", abbr: "DP", label: "REBEL Diabetes Prevention Program" },
    qr: "assets/qr-score.svg",
    qrUrl: "https://rebel.typeform.com/to/MnuskhU7?typeform-source=qrcode-button",
    cta: {
      title: "Early action starts with a number",
      text: "In the Philippines, 53.5 percent of adults with diabetes don't know they have it. A quick check is the fastest way to know.",
      links: [
        { href: "https://worlddiabetesday.org/", title: "Test your type 2 diabetes risk", sub: "World Diabetes Day, International Diabetes Federation" },
        { href: "https://rebel-eap.as.me/dp", title: "Book a REBEL diabetes consult", sub: "Talk it through with a health professional" }
      ]
    },
    myths: [
      { id: "nosymptoms", t: "No symptoms means no diabetes.", a: "myth",
        e: "Type 2 often has few or no symptoms. For many people, the first sign is a complication." },
      { id: "rank", t: "Diabetes is one of the top 5 causes of death in the Philippines.", a: "fact",
        e: "PSA's provisional 2024 data rank it 5th, at 6.3 percent of deaths." },
      { id: "rice", t: "White rice alone causes diabetes.", a: "myth",
        e: "No single food does. Total diet, portions, weight and activity all count." },
      { id: "sweetsonly", t: "Sweets are the only thing that raises your risk.", a: "myth",
        e: "Refined carbs, inactivity, smoking, alcohol, extra weight and family history count too." },
      { id: "weight", t: "Someone at a normal weight can have type 2 diabetes.", a: "fact",
        e: "Weight is one risk factor, not the only one." },
      { id: "t1sugar", t: "Eating too much sugar causes type 1 diabetes.", a: "myth",
        e: "Type 1 is an autoimmune condition. Sugar doesn't cause it.", f: "Your coworker says otherwise? Time to gently correct them." },
      { id: "t1age", t: "Type 1 diabetes only develops in children.", a: "myth",
        e: "It often develops fast, and it can show up at any age." },
      { id: "konsulta", t: "PhilHealth's primary care package covers maintenance medicines for diabetes.", a: "fact",
        e: "Konsulta/YAKAP covers 75 essential medicines, including diabetes maintenance drugs." }
    ],
    rounds: [
      { type: "myth", name: "Myth or fact", hint: "Four cards. Swipe each one, or use the arrow keys.", n: 4 },
      { type: "crowd", name: "Crowd check", hint: "Tap how many of the 10 you think don't know it yet.",
        cfg: { key: "crowd", prompt: "10 Filipinos have diabetes. How many don't know it yet?", full: 5, part: 1, accept: [4, 6],
               explain: "More than half of Filipino adults with diabetes, 53.5 percent, are undiagnosed.", fun: "Anywhere from 4 to 6 counts as spot on." } },
      { type: "slider", name: "Sulit o Sakit", hint: "Drag the slider to an amount in pesos.",
        cfg: { key: "tax", prompt: "What is the tax per liter on sweetened drinks?", min: 0, max: 20, step: 1, start: 10,
               prefix: "₱", ticks: [0, 5, 10, 15, 20], accept: [5, 7],
               good: "Right range", bad: "Not quite",
               explain: "It's ₱6 per liter for drinks with caloric sweeteners. Sales fell about 6.5 percent on average, and 25 percent for powdered mixes.", fun: "₱5 to ₱7 counts." } },
      { type: "signs", name: "Early signs", hint: "Tap every card that is a real warning sign.", maxMiss: 1,
        real: ["Constant thirst", "Urinating a lot, even at night", "Unexplained weight loss", "Blurred vision", "Wounds that heal slowly", "Always tired"],
        decoy: ["Hiccups", "Sneezing", "Sudden hair color change"],
        teach: "Type 2 can be quiet for years. If you notice any of these, ask for a blood sugar test." }
    ]
  }
};
