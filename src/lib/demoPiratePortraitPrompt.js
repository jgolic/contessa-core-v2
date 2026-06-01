export function buildDemoPiratePortraitPrompt(person, vessel) {
  const name =
    person?.name ||
    person?.fullName ||
    [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
    "Crew member";
  const position = person?.position || person?.title || person?.rank || person?.role || "Crew";

  return `
Create a realistic passport-style ID portrait of a professional superyacht crew member as a tasteful pirate character.

Subject:
${name}, ${position} onboard ${vessel?.name || "a private motor yacht"}.

Style:
realistic photographic portrait, ID photo composition, centered shoulders-up, neutral clean background, premium yacht crew appearance, subtle pirate-inspired styling such as elegant dark naval coat, refined pirate hat, tasteful nautical details.

Do not include weapons.
Do not make it cartoonish.
Do not make it fantasy.
Do not make it scary.
Do not include text in the image.
Lighting should be professional studio lighting.
The result should look like a polished demo crew profile photo, not an official passport photo.
`.trim();
}
