import {
  dialQuery,
  keypadDigit,
  matchContacts,
  toKeypadDigits,
} from "../src/core/contacts.ts";

const contacts = [
  { name: "Alex Morgan", number: "7003" },
  { name: "Sam Lee", number: "7010" },
  { name: "Jamie Park", number: "+1 (415) 555-0101" },
  { name: "Zoë Ångström", number: "8800" },
];

describe("keypad letters", () => {
  it("maps letters, digits, and accents to keypad digits", () => {
    expect(toKeypadDigits("Alex")).toBe("2539");
    expect(toKeypadDigits("Zoë Å")).toBe("9632");
    expect(keypadDigit("*")).toBe("*");
    expect(keypadDigit("-")).toBe("");
    expect(dialQuery("+1 (415) 555-0101")).toBe("+14155550101");
  });
});

describe("smart dial matching", () => {
  it("returns nothing for an empty query", () => {
    expect(matchContacts("", { contacts })).toEqual([]);
  });

  it("matches number prefixes above substrings and highlights the formatted digits", () => {
    const [first] = matchContacts("415", { contacts });
    expect(first.contact.name).toBe("Jamie Park");
    const number = first.contact.number;
    const [start, end] = first.numberRanges[0];
    expect(number.slice(start, end)).toBe("415");
    const ranked = matchContacts("70", { contacts }).map((m) => m.contact.name);
    expect(ranked).toEqual(["Alex Morgan", "Sam Lee"]);
  });

  it("matches word prefixes by keypad letters, first names first", () => {
    const morgan = matchContacts("6674", { contacts })[0];
    expect(morgan.contact.name).toBe("Alex Morgan");
    expect(morgan.contact.name!.slice(...morgan.nameRanges[0])).toBe("Morg");
    expect(matchContacts("726", { contacts })[0].contact.name).toBe("Sam Lee");
    expect(matchContacts("96", { contacts })[0].contact.name).toBe(
      "Zoë Ångström",
    );
  });

  it("matches initials, ranked below word prefixes", () => {
    const matches = matchContacts("26", { contacts });
    // "26" also spells the start of "Ångström", a stronger word-prefix match.
    expect(matches.map((m) => m.contact.name)).toEqual([
      "Zoë Ångström",
      "Alex Morgan",
    ]);
    expect(matches[1].nameRanges).toEqual([
      [0, 1],
      [5, 6],
    ]);
  });

  it("prefers exact numbers, merges duplicates, and favours contacts over recents", () => {
    const recents = [
      { number: "7003" },
      { number: "7999", name: "Taylor Reed" },
    ];
    const matches = matchContacts("7003", { contacts, recents });
    expect(matches[0]).toMatchObject({
      source: "contacts",
      contact: { name: "Alex Morgan" },
    });
    expect(matches.filter((m) => m.contact.number === "7003")).toHaveLength(1);
    expect(matchContacts("79", { recents })[0]).toMatchObject({
      source: "recents",
      contact: { name: "Taylor Reed" },
    });
  });

  it("respects the limit", () => {
    expect(matchContacts("0", { contacts }, 2)).toHaveLength(2);
    expect(matchContacts("0", { contacts }, 0)).toHaveLength(0);
  });
});
