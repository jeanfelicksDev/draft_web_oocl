export const EUROPEAN_COUNTRIES = [
    "Albanie", "Allemagne", "Belgique", "Bulgarie", "Croatie", "Danemark", 
    "Espagne", "Estonie", "Finlande", "France", "Géorgie", "Grèce", 
    "Irlande", "Islande", "Italie", "Lettonie", "Lituanie", "Malte", 
    "Monténégro", "Norvège", "Pays-Bas", "Pologne", "Portugal", 
    "Roumanie", "Royaume-Uni", "Russie", "Slovénie", "Suède", "Ukraine"
];

export const countryRequirements: Record<string, string[]> = {
    "Chine": ["USCI"],
    "Australie": ["USCI"],
    ...Object.fromEntries(EUROPEAN_COUNTRIES.map(c => [c, ["EORI"]]))
};

export const cityRequirements: Record<string, string[]> = {
    "Abidjan": ["VAT"],
    "Cotonou": ["BIN"],
    "Bruxelles": ["VAT"],
    "Hô Chi Minh-Ville (Cai Mep)": ["VAT"]
};
