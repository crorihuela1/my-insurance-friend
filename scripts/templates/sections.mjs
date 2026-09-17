import { list, pick, pickMany } from './util.mjs';
import { traits } from './traits.mjs';
import { COST_NOTE, LAW_CLOSE, TRAIT_PARA } from './pools.mjs';

/**
 * Section copy pools. Order is fixed (pain -> cost -> law -> process), matching
 * the approved Paterson reference pages; only the phrasing rotates, seeded off
 * each page's slug.
 *
 * Every page's genuinely distinctive content comes from towns.json `angles`.
 * These pools exist so the connective tissue around that angle isn't identical
 * across 92 pages - they are not a substitute for a good angle.
 *
 * Nothing here may recommend coverage, quote the reader a premium, or claim we
 * are licensed. scripts/lint-compliance.mjs enforces that on the built HTML.
 */

const fmt = (n) => n.toLocaleString('en-US');

// ---------------------------------------------------------------- pain -----

const PAIN_HEADING = {
  es: {
    'contractor-insurance': ['La realidad del contratista en {town}', 'Cómo se trabaja en {town}', 'El problema real de los contratistas en {town}'],
    'cheap-auto-insurance': ['Por qué el seguro cuesta lo que cuesta en {town}', 'Manejar en {town}', 'Lo que encarece el seguro en {town}'],
    'renters-insurance': ['Cómo se renta en {town}', 'La realidad del inquilino en {town}', 'Por qué esto importa en {town}'],
    'workers-comp': ['Tener empleados en {town}', 'La realidad del patrón en {town}', 'Lo que se ve en {town}'],
  },
  en: {
    'contractor-insurance': ['What contracting in {town} looks like', 'How the work runs in {town}', 'The real problem for {town} contractors'],
    'cheap-auto-insurance': ['Why insurance costs what it costs in {town}', 'Driving in {town}', "What drives {town} premiums up"],
    'renters-insurance': ['Renting in {town}', 'The reality for {town} tenants', 'Why this matters in {town}'],
    'workers-comp': ['Having employees in {town}', 'What employers face in {town}', 'What we see in {town}'],
  },
};

function painContext(ctx) {
  const { town, lang, nearby } = ctx;
  const zips = town.zip_list.slice(0, 4).join(', ');
  const many = town.zip_list.length > 1;
  // Agreement matters: several towns here have exactly one ZIP.
  const zipLabel = lang === 'es'
    ? (many ? `los códigos postales ${zips}` : `el código postal ${zips}`)
    : (many ? `ZIP codes ${zips}` : `ZIP code ${zips}`);
  const nearbyNames = list(nearby.slice(0, 3).map((n) => (lang === 'es' ? n.name_es : n.name_en)), lang);
  const county = lang === 'es' ? town.county_es : `${town.county} County`;

  const es = [
    `${town.name_es} está en el ${county}, con cerca de ${fmt(town.pop)} habitantes y ${zipLabel}. Alrededor del ${town.hispanic_pct}% de la población es hispana, y eso cambia la conversación: aquí el trámite se hace en español o no se hace.`,
    `Hablamos de una ciudad de unos ${fmt(town.pop)} habitantes en el ${county}, donde cubrimos ${zipLabel}, con una población hispana cercana al ${town.hispanic_pct}%. No es un detalle demográfico: define en qué idioma se explica una póliza y quién termina entendiendo lo que firmó.`,
    `Con aproximadamente ${fmt(town.pop)} habitantes y una población hispana del ${town.hispanic_pct}%, ${town.name_es} concentra en el ${county} el tipo de cliente al que casi nadie le explica bien las cosas. Cubrimos ${zipLabel}.`,
  ];
  const en = [
    `${town.name_en} sits in ${county}, with roughly ${fmt(town.pop)} residents and ${zipLabel}. About ${town.hispanic_pct}% of the population is Hispanic, which changes the conversation: here the paperwork gets done in Spanish or it doesn't get done.`,
    `This is a city of about ${fmt(town.pop)} people in ${county}, covering ${zipLabel}, with a Hispanic population near ${town.hispanic_pct}%. That isn't a demographic footnote — it decides what language a policy gets explained in, and who ends up understanding what they signed.`,
    `At roughly ${fmt(town.pop)} residents and ${town.hispanic_pct}% Hispanic, ${town.name_en} concentrates the kind of customer nobody explains this to properly, across ${zipLabel} in ${county}.`,
  ];

  const base = pick(lang === 'es' ? es : en, `${town.slug}:pain:${lang}`);
  const tail =
    lang === 'es'
      ? ` Buena parte de la gente que nos escribe desde ${town.name_es} también se mueve a ${nearbyNames}, así que lo que aplica aquí rara vez se queda solo aquí.`
      : ` A lot of the people who contact us from ${town.name_en} also move between ${nearbyNames}, so what applies here rarely stays here.`;
  return base + tail;
}

// ---------------------------------------------------------------- cost -----

const COST_FACTORS = {
  es: {
    'contractor-insurance': [
      '**El oficio.** Techos, demolición y trabajo en altura se cotizan distinto que pintura o carpintería de acabado.',
      '**La nómina.** El workers\' comp se calcula por cada $100 de nómina, multiplicado por la tarifa del código de clasificación que te asignen.',
      '**Los años operando y el historial de reclamos.** Cinco años limpios no se cotizan igual que un negocio que abrió el mes pasado.',
      '**Los límites que pidas.** Subir de $500,000 a $1,000,000 no cuesta el doble, pero sí cambia el número.',
      '**Si usas subcontratistas.** Un sub sin su propia póliza normalmente termina contando en tu nómina auditable.',
      '**El tipo de propiedad donde trabajas.** Residencial, comercial e institucional tienen requisitos y precios distintos.',
      '**Si necesitas endosos.** Additional insured y waiver of subrogation son cambios en la póliza, no solo papeles.',
    ],
    'cheap-auto-insurance': [
      '**El código postal exacto.** Dos códigos de la misma ciudad no cotizan igual.',
      '**El millaje anual y el uso.** Manejar a obras todos los días no es lo mismo que manejar al supermercado, y declararlo mal te puede costar un reclamo.',
      '**Los lapsos de cobertura.** Un hueco sin seguro sube el precio y lo mantiene arriba por años.',
      '**El modelo del vehículo.** No es cuánto costó, es cuánto cuesta repararlo y qué tan seguido lo roban.',
      '**Cómo pagas.** Pagar seis meses completos casi siempre sale distinto que pagar mes a mes con recargo.',
      '**El historial de manejo.** Multas, accidentes y reclamos previos pesan, pero menos de lo que la gente cree frente al código postal.',
      '**Quién más maneja el carro.** Los conductores de la casa que aparecen en la póliza cambian el cálculo.',
    ],
    'renters-insurance': [
      '**El límite de contenidos.** Cubrir $15,000 en pertenencias no cuesta lo mismo que cubrir $50,000.',
      '**El deducible.** Un deducible más alto baja el pago mensual y sube lo que pones de tu bolsillo en un reclamo.',
      '**El límite de responsabilidad.** Muchos landlords exigen un mínimo específico por contrato.',
      '**El edificio.** La antigüedad, el material y si tiene alarma o rociadores cambian el número.',
      '**Si tienes mascota.** Algunas razas afectan la parte de responsabilidad de la póliza.',
      '**Si trabajas desde casa.** Equipo de trabajo en la vivienda puede quedar fuera de una póliza de inquilino normal.',
    ],
    'workers-comp': [
      '**El código de clasificación.** Es el factor más grande: el mismo sueldo cuesta muy distinto según el oficio.',
      '**La nómina real.** La prima se calcula por cada $100 de nómina y se audita al final del año.',
      '**El experience mod.** Tu historial de reclamos ajusta la tarifa hacia arriba o hacia abajo.',
      '**Cuántos estados cubres.** Trabajar en más de un estado cambia cómo se emite la póliza.',
      '**Si usas subcontratistas.** Los subs sin su propia cobertura normalmente se suman a tu nómina auditable.',
      '**El tipo de trabajo dentro del oficio.** Trabajo en altura o con maquinaria pesada no se clasifica igual que trabajo a nivel de piso.',
    ],
  },
  en: {
    'contractor-insurance': [
      '**The trade.** Roofing, demolition and work at height price differently than painting or finish carpentry.',
      '**Payroll.** Workers\' comp is calculated per $100 of payroll, multiplied by whatever class code rate you are assigned.',
      '**Years in business and claims history.** Five clean years does not price like a business that opened last month.',
      '**The limits you carry.** Going from $500,000 to $1,000,000 does not double the cost, but it moves the number.',
      '**Whether you use subcontractors.** A sub without their own policy usually ends up counted in your auditable payroll.',
      '**The property type you work on.** Residential, commercial and institutional carry different requirements and prices.',
      '**Whether you need endorsements.** Additional insured and waiver of subrogation are policy changes, not just paperwork.',
    ],
    'cheap-auto-insurance': [
      '**The exact ZIP code.** Two ZIPs in the same city do not price the same.',
      '**Annual mileage and use.** Driving to job sites daily is not the same as driving to the store, and reporting it wrong can cost you a claim.',
      '**Coverage lapses.** A gap without insurance raises the price and keeps it raised for years.',
      '**The vehicle model.** Not what it cost, but what it costs to repair and how often that model gets stolen.',
      '**How you pay.** Paying six months in full almost always comes out differently than monthly with an installment fee.',
      '**Driving history.** Tickets, crashes and prior claims matter, though less than people expect next to the ZIP code.',
      '**Who else drives the car.** Household drivers listed on the policy change the math.',
    ],
    'renters-insurance': [
      '**The contents limit.** Covering $15,000 of belongings does not cost the same as covering $50,000.',
      '**The deductible.** A higher deductible lowers the monthly payment and raises what comes out of your pocket at claim time.',
      '**The liability limit.** Many landlords require a specific minimum by lease.',
      '**The building.** Age, construction type and whether it has alarms or sprinklers move the number.',
      '**Whether you have a pet.** Some breeds affect the liability side of the policy.',
      '**Whether you work from home.** Business equipment in the home can fall outside a standard renters policy.',
    ],
    'workers-comp': [
      '**The class code.** This is the biggest factor: the same wage costs very differently by trade.',
      '**Actual payroll.** Premium is calculated per $100 of payroll and audited at year end.',
      '**The experience mod.** Your claims history adjusts the rate up or down.',
      '**How many states you cover.** Working in more than one state changes how the policy is issued.',
      '**Whether you use subcontractors.** Subs without their own coverage usually get added to your auditable payroll.',
      '**The kind of work within the trade.** Work at height or with heavy machinery does not classify like ground-level work.',
    ],
  },
};

const COST_BRIDGE = {
  es: {
    'contractor-insurance': [
      'Ahora, de esos límites una parte no la decides tú. Hay un piso que pone el estado y otro que pone tu cliente, y no son el mismo número.',
      'Lo que no se negocia es el mínimo. El estado fija un piso y tu cliente fija otro, casi siempre más alto.',
      'Hasta aquí lo que mueve el precio. Falta lo que no se mueve: lo que la ley te obliga a cargar, y lo que el contrato te obliga a cargar encima.',
      'Ese es el lado del precio. El otro lado son los requisitos, y ahí hay dos que se cumplen por separado.',
    ],
    'cheap-auto-insurance': [
      'Lo que no se negocia es el piso. El estado fija un mínimo que tienes que cargar sí o sí.',
      'Todo eso mueve el precio. Hay un número que no se mueve: el mínimo que exige el estado.',
      'Esos factores explican por qué dos vecinos pagan distinto. Lo que no cambia de un vecino a otro es el mínimo legal.',
      'Con eso en mente, conviene saber cuál es el piso legal, porque por debajo de ahí no hay póliza válida.',
    ],
    'renters-insurance': [
      'Lo que sí conviene tener claro es qué cubre realmente la póliza, y qué no.',
      'Antes del precio, vale la pena saber qué entra y qué queda fuera.',
      'El precio importa menos que la letra: lo que decide si te sirve o no es el alcance de la cobertura.',
      'Dicho el rango, la pregunta útil es otra: qué cubre exactamente y qué está excluido.',
    ],
    'workers-comp': [
      'El precio varía. La obligación de tenerlo, no.',
      'Eso es lo que mueve el número. Lo que no se mueve es si estás obligado a tenerlo.',
      'Ese es el cálculo. La parte que no se calcula es si te aplica o no, porque eso lo decide la ley.',
      'Hasta aquí el costo. La pregunta anterior, y más importante, es desde cuándo estás obligado.',
    ],
  },
  en: {
    'contractor-insurance': [
      'Now, part of those limits is not your decision. There is a floor the state sets and another the client sets, and they are not the same number.',
      'What is not negotiable is the minimum. The state sets one floor and your client sets another, usually higher.',
      'That is what moves the price. What does not move is what the law requires you to carry, and what the contract requires on top of it.',
      'That is the price side. The other side is requirements, and there are two of them you satisfy separately.',
    ],
    'cheap-auto-insurance': [
      'What is not negotiable is the floor. The state sets a minimum you have to carry either way.',
      'All of that moves the price. One number does not move: the state minimum.',
      'Those factors explain why two neighbors pay differently. What does not change between neighbors is the legal minimum.',
      'With that in mind, it is worth knowing the legal floor, because below it there is no valid policy.',
    ],
    'renters-insurance': [
      'What is worth being clear on is what the policy actually covers, and what it does not.',
      'Before price, it is worth knowing what is included and what is excluded.',
      'Price matters less than the fine print: what decides whether it helps you is the scope of coverage.',
      'With the range stated, the useful question is a different one: what exactly is covered, and what is excluded.',
    ],
    'workers-comp': [
      'The price varies. The obligation to have it does not.',
      'That is what moves the number. What does not move is whether you are required to carry it.',
      'That is the calculation. The part that is not calculated is whether it applies to you, because the law decides that.',
      'That is the cost. The prior, and more important, question is from when you are required to carry it.',
    ],
  },
};

// ----------------------------------------------------------------- law -----

const LAW_HEADING = {
  es: {
    'contractor-insurance': 'Qué exige la ley en {state_name}',
    'cheap-auto-insurance': 'Qué exige la ley en {state_name}',
    'renters-insurance': 'Qué cubre y qué no cubre',
    'workers-comp': 'Qué exige la ley en {state_name}',
  },
  en: {
    'contractor-insurance': 'What {state_name} law requires',
    'cheap-auto-insurance': 'What {state_name} law requires',
    'renters-insurance': 'What it covers and what it does not',
    'workers-comp': 'What {state_name} law requires',
  },
};

const LAW_INTRO = {
  es: {
    'contractor-insurance': [
      'Son dos cosas distintas y se cumplen por separado: lo que exige el estado para que te registres y lo que exige tu cliente para dejarte entrar a la obra. Cumplir una no te cubre la otra.',
      'Conviene separar dos requisitos que suelen confundirse: el del estado para registrarte, y el del contrato para que te dejen trabajar.',
      'Aquí hay dos listas, no una. La del estado, que te habilita a operar, y la del cliente, que te habilita a entrar a esa obra en particular.',
      'Del lado del estado, esto es lo que dice la regulación. Del lado del cliente, es otra historia y viene después.',
    ],
    'cheap-auto-insurance': [
      'Esto es lo que el estado obliga a cargar:',
      'Estos son los mínimos que fija el estado:',
      'Antes de comparar precios, conviene saber contra qué se compara. Este es el piso legal:',
      'Lo que sigue no es opinión ni oferta de una aseguradora: es lo que exige la ley.',
    ],
    'renters-insurance': [
      'No hay una ley que te obligue a tener seguro de inquilino. Lo que sí hay son contratos de renta que lo exigen, y una lista concreta de lo que la póliza cubre y lo que deja fuera.',
      'A diferencia del seguro de auto, aquí no hay un mínimo legal. Lo que manda es el contrato de renta y lo que dice la póliza.',
      'Nadie te va a multar por no tener seguro de inquilino. Lo que sí puede pasar es que no te firmen el lease, o que un daño lo termines pagando tú.',
      'Esta cobertura no es obligatoria por ley, así que la pregunta útil no es si te obligan, sino qué cubre exactamente.',
    ],
    'workers-comp': [
      'Esto no depende del tamaño del negocio ni de cómo le pagues a tu gente:',
      'La regla es más simple de lo que la gente cree:',
      'No hay un número mínimo de empleados a partir del cual aplica. Esto es lo que dice la ley:',
      'Antes de hablar de precio, conviene saber exactamente desde cuándo estás obligado:',
    ],
  },
  en: {
    'contractor-insurance': [
      'They are two different things and you satisfy them separately: what the state requires for you to register, and what your client requires to let you on site. Meeting one does not cover the other.',
      'Two requirements get confused here and are worth separating: the state\'s, to register, and the contract\'s, to get you working.',
      'There are two lists here, not one. The state\'s, which lets you operate, and the client\'s, which lets you onto that particular job.',
      'On the state side, here is what the regulation says. The client side is a different story, and it comes after.',
    ],
    'cheap-auto-insurance': [
      'Here is what the state requires you to carry:',
      'These are the minimums the state sets:',
      'Before comparing prices, it helps to know what you are comparing against. This is the legal floor:',
      'What follows is not an opinion or a carrier\'s offer: it is what the law requires.',
    ],
    'renters-insurance': [
      'No law requires you to carry renters insurance. What does exist are leases that require it, and a concrete list of what the policy covers and what it leaves out.',
      'Unlike auto insurance, there is no legal minimum here. What governs is the lease and what the policy says.',
      'Nobody will fine you for not having renters insurance. What can happen is that the lease does not get signed, or that damage ends up coming out of your pocket.',
      'This coverage is not required by law, so the useful question is not whether you are forced to carry it, but what exactly it covers.',
    ],
    'workers-comp': [
      'This does not depend on the size of the business or how you pay your people:',
      'The rule is simpler than people think:',
      'There is no minimum headcount at which this kicks in. Here is what the law says:',
      'Before talking price, it is worth knowing exactly when the obligation starts:',
    ],
  },
};

const RENTERS_COVERAGE = {
  es: `Una póliza de inquilino estándar se divide en tres partes: **contenidos** (tus
muebles, ropa, electrónicos y herramienta personal), **responsabilidad personal**
(si un daño empieza en tu unidad y afecta a alguien más) y **gastos de vivienda
temporal** (si el lugar queda inhabitable).

Lo que deja fuera es igual de importante: **la inundación no está cubierta** en una
póliza estándar, ni el daño por terremoto, ni normalmente el equipo de un negocio
que operes desde la casa. La póliza del dueño del edificio cubre la estructura, no
tus cosas.`,
  en: `A standard renters policy splits into three parts: **contents** (your furniture,
clothes, electronics and personal tools), **personal liability** (if damage starts
in your unit and affects someone else) and **additional living expenses** (if the
place becomes uninhabitable).

What it leaves out matters just as much: **flood is not covered** under a standard
policy, neither is earthquake damage, and usually neither is equipment for a
business you run from home. The building owner's policy covers the structure, not
your belongings.`,
};

// ------------------------------------------------------------- process -----

function processSection(ctx) {
  const { town, service, lang } = ctx;
  const name = lang === 'es' ? town.name_es : town.name_en;
  const stateName = lang === 'es'
    ? (town.state === 'NJ' ? 'Nueva Jersey' : 'Nueva York')
    : (town.state === 'NJ' ? 'New Jersey' : 'New York');
  const seed = `${town.slug}:${service.slug_en}:${lang}:process`;

  const askEs = {
    'contractor-insurance': 'qué oficio haces, cuántas personas trabajan contigo, si tienes empleados en nómina, y qué te está pidiendo el cliente por escrito',
    'cheap-auto-insurance': 'qué vehículo manejas, si tienes seguro ahora mismo, y qué documento tienes para identificarte',
    'renters-insurance': 'la dirección, cuándo empieza el lease, y si el landlord te pidió un límite específico',
    'workers-comp': 'qué hace tu negocio, cuántos empleados tienes, y en qué estados trabajan',
  };
  const askEn = {
    'contractor-insurance': 'what trade you work, how many people work with you, whether you have employees on payroll, and what the client is asking for in writing',
    'cheap-auto-insurance': 'what vehicle you drive, whether you have insurance right now, and what ID document you hold',
    'renters-insurance': 'the address, when the lease starts, and whether the landlord asked for a specific limit',
    'workers-comp': 'what your business does, how many employees you have, and which states they work in',
  };

  const ask = lang === 'es' ? askEs[service.slug_en] : askEn[service.slug_en];

  const es = [
`## Cómo funciona con nosotros

Somos un servicio de referido, no una agencia. Esto es lo que pasa cuando nos escribes desde ${name}:

1. **Nos cuentas tu situación** por WhatsApp o con el formulario de esta página: ${ask}.
2. **Te conectamos con un agente con licencia** en ${stateName} que trabaja con este tipo de riesgo. Ese agente revisa tu caso, te dice qué opciones existen y emite la póliza. Nosotros no vendemos pólizas.
3. **El agente te explica las opciones en español**, con los números de tu caso y no los de un promedio estatal.
4. **Tú decides.** Si algo no cuadra, no pasa nada: conectarte no te cuesta nada.

Recibimos una tarifa fija de referido de la agencia. Esa tarifa no cambia según lo que compres, ni si compras.`,

`## Cómo funciona con nosotros

Para que quede claro desde el principio: no somos agencia ni corredor, y no vendemos pólizas. Lo que hacemos es conectarte con alguien que sí tiene licencia para hacerlo.

1. **Escríbenos** por WhatsApp o llena el formulario de abajo. Necesitamos saber ${ask}.
2. **Buscamos al agente adecuado.** No todos los agentes de ${stateName} trabajan este tipo de riesgo, y mandarte con el equivocado te hace perder tiempo.
3. **El agente te atiende en tu idioma** y te explica qué cambia entre una opción y otra, con tus números.
4. **La decisión es tuya**, sin presión y sin costo por habernos escrito.

La agencia nos paga una tarifa fija por el referido. No es comisión: no sube si compras más ni desaparece si no compras.`,

`## Cómo funciona con nosotros

Cuatro pasos, sin vueltas. Somos un servicio de referido en ${name}, no una agencia de seguros.

1. **Cuéntanos tu caso** por WhatsApp o con el formulario: ${ask}.
2. **Te presentamos a un agente con licencia** en ${stateName} que ya trabaja con clientes como tú.
3. **Él o ella arma las opciones** y te las explica en español, incluyendo lo que no conviene de cada una.
4. **Tú eliges, o no eliges nada.** No te cobramos por conectarte y no insistimos.

Nuestro ingreso es una tarifa fija que paga la agencia por el referido, no un porcentaje de tu póliza. Por eso no tenemos motivo para empujarte a nada.`,
  ];

  const en = [
`## How it works with us

We are a referral service, not an agency. Here is what happens when you contact us from ${name}:

1. **You tell us your situation** over WhatsApp or through the form on this page: ${ask}.
2. **We connect you with a licensed agent** in ${stateName} who works with this kind of risk. That agent reviews your case, tells you what options exist, and issues the policy. We do not sell policies.
3. **The agent explains the options** in English or Spanish, using your numbers rather than a statewide average.
4. **You decide.** If it does not add up, that is fine: the connection costs you nothing.

We receive a flat referral fee from the agency. That fee does not change based on what you buy, or whether you buy.`,

`## How it works with us

To be clear up front: we are not an agency or a broker, and we do not sell policies. What we do is connect you with someone who is licensed to.

1. **Message us** on WhatsApp or fill out the form below. We need to know ${ask}.
2. **We find the right agent.** Not every agent in ${stateName} works this kind of risk, and sending you to the wrong one wastes your time.
3. **The agent works with you in your language** and explains what changes between one option and another, using your numbers.
4. **The decision is yours**, with no pressure and no charge for contacting us.

The agency pays us a flat referral fee. It is not commission: it does not rise if you buy more, and it does not vanish if you buy nothing.`,

`## How it works with us

Four steps, no runaround. We are a referral service in ${name}, not an insurance agency.

1. **Tell us your case** on WhatsApp or through the form: ${ask}.
2. **We introduce you to a licensed agent** in ${stateName} who already works with clients like you.
3. **They build the options** and walk you through them, including the downside of each.
4. **You choose, or you choose nothing.** We do not charge for the connection and we do not chase you.

Our income is a flat fee the agency pays for the referral, not a percentage of your policy. That is why we have no reason to push you toward anything.`,
  ];

  return pick(lang === 'es' ? es : en, seed);
}

// ------------------------------------------------------------ assembly -----

export function buildBody(ctx) {
  const { town, service, lang, angle, factIds } = ctx;
  const seed = `${town.slug}:${service.slug_en}:${lang}`;
  const name = lang === 'es' ? town.name_es : town.name_en;
  const stateName = lang === 'es'
    ? (town.state === 'NJ' ? 'Nueva Jersey' : 'Nueva York')
    : (town.state === 'NJ' ? 'New Jersey' : 'New York');
  const tr = traits(town);

  // Which trait paragraph fits this town. NY jurisdiction wins over shape,
  // because the legal framing differs more than the streetscape does.
  const traitKind = tr.state === 'NY' ? 'ny' : tr.size === 'small' ? 'small' : tr.compact ? 'compact' : 'spread';

  const parts = [];

  // --- Pain: the town's own angle, then its numbers, then its shape.
  const painH = pick(PAIN_HEADING[lang][service.slug_en], `${seed}:painH`).replace('{town}', name);
  const traitPara = TRAIT_PARA[lang][service.slug_en][traitKind];
  parts.push(`## ${painH}\n\n${angle}\n\n${painContext(ctx)}\n\n${traitPara}`);

  // --- Cost
  const costH = lang === 'es' ? `Cuánto cuesta en ${name}, en rangos` : `What it costs in ${name}, in ranges`;
  const costNote = pick(COST_NOTE[lang], `${seed}:costNote`);
  const costIntro = lang === 'es' ? service.cost_range_es : service.cost_range_en;
  const factors = pickMany(COST_FACTORS[lang][service.slug_en], 5, `${seed}:factors`);
  const RANGE_LEAD = {
    es: 'Ese rango es amplio a propósito, porque el precio se mueve con factores concretos:',
    en: 'That range is wide on purpose, because price moves with concrete factors:',
  };
  const CALC_LEAD = {
    es: 'No hay un precio de lista. El número final depende de factores concretos:',
    en: 'There is no list price. The final number depends on concrete factors:',
  };
  const factorsLead = service.slug_en === 'workers-comp' ? CALC_LEAD[lang] : RANGE_LEAD[lang];
  const bridge = pick(COST_BRIDGE[lang][service.slug_en], `${seed}:bridge`);
  parts.push(
    `## ${costH}\n\n${costNote}\n\n${costIntro}\n\n${factorsLead}\n\n` +
      `${factors.map((f) => `- ${f}`).join('\n')}\n\n${bridge}`,
  );

  // --- Law
  const lawH = LAW_HEADING[lang][service.slug_en].replace('{state_name}', stateName);
  const lawIntro = pick(LAW_INTRO[lang][service.slug_en], `${seed}:lawIntro`);
  let lawBody = `## ${lawH}\n\n${lawIntro}`;
  if (factIds.length) {
    const items = factIds.map((id) => `  <Fact id="${id}" lang="${lang}" />`).join('\n');
    lawBody += `\n\n<ul class="fact-list">\n${items}\n</ul>`;
  } else if (service.slug_en === 'renters-insurance') {
    lawBody += `\n\n${RENTERS_COVERAGE[lang]}`;
  }
  if (service.slug_en === 'contractor-insurance') {
    lawBody += lang === 'es'
      ? `\n\nDel lado del cliente, el estándar práctico casi siempre está por encima del mínimo estatal. Un límite de $1,000,000 por ocurrencia aparece en la mayoría de los contratos que vemos, junto con *additional insured*. Eso no lo pide la ley, lo pide el contrato.`
      : `\n\nOn the client side, the working standard almost always sits above the state minimum. A $1,000,000 per-occurrence limit appears in most contracts we see, along with *additional insured* status. The law does not require that; the contract does.`;
  }
  lawBody += `\n\n${pick(LAW_CLOSE[lang][service.slug_en], `${seed}:lawClose`)}`;
  parts.push(lawBody);

  // --- Process
  parts.push(processSection(ctx));

  return parts.join('\n\n');
}
