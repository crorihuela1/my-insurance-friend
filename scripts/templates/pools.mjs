/**
 * Copy pools for generated pages.
 *
 * Two mechanisms keep 92 pages from converging:
 *   1. Trait-conditional paragraphs - a dense single-ZIP city in NJ and a
 *      spread-out borough in NY get different sentences, not the same one.
 *   2. Deep rotation pools - where copy must say the same thing, it says it
 *      several different ways, selected stably by page slug.
 *
 * Nothing here may recommend coverage, quote the reader a premium, or claim we
 * are licensed. lint-compliance.mjs enforces that against the built HTML.
 */

// Trait paragraphs: [compactDense, spreadCity, nyJurisdiction, smallTown]
export const TRAIT_PARA = {
  es: {
    'contractor-insurance': {
      compact: 'Trabajar aquí es trabajar apretado: edificios pegados, sin driveway donde dejar el material, y vecinos a un metro del andamio. El riesgo de dañar propiedad ajena no es teórico, es diario, y es justo lo que responde la parte de daños a la propiedad de una póliza de responsabilidad civil. Un balde de pintura sobre el carro del vecino ya es un reclamo.',
      spread: 'El trabajo aquí se reparte entre barrios que no se parecen: casas unifamiliares en una parte, edificios de varias unidades en otra, y locales comerciales en el corredor principal. Cada tipo de propiedad trae su propio contrato y sus propios requisitos de seguro, y el certificado que te sirvió en una obra puede no servirte en la siguiente.',
      small: 'Siendo un pueblo chico rodeado de municipios más caros, casi todo el trabajo sale hacia afuera. Eso significa clientes que preguntan por el seguro antes de preguntar por el precio, y que a veces piden ver el certificado antes de dejarte entrar a la casa. Aquí el COI es parte de la propuesta comercial, no un trámite posterior.',
      ny: 'Al trabajar en Nueva York entras al terreno del Department of Buildings: la licencia de contratista depende de mantener la responsabilidad civil activa, y un lapso en la póliza no solo frena un trabajo, puede frenar la licencia. Es un requisito más estricto que el de Nueva Jersey y agarra desprevenido a mucha gente que se mudó.',
    },
    'cheap-auto-insurance': {
      compact: 'En una ciudad tan compacta el carro vive en la calle. Estacionamiento paralelo, golpes de espejo, robo de catalizador y vandalismo son la razón número uno por la que aquí la gente pregunta por comprehensive y no por liability. Y la densidad misma es parte de por qué el código postal cotiza como cotiza.',
      spread: 'Aquí se maneja de todo: trayectos cortos dentro de la ciudad y viajes largos por carretera hacia el trabajo. Esa mezcla importa porque las aseguradoras cotizan el millaje anual y el uso declarado, y responder eso a la ligera es una forma silenciosa de tener problemas cuando presentas un reclamo.',
      small: 'Manejar desde aquí normalmente significa carretera: más millas, a más velocidad, hacia trabajos en otros municipios. Ese perfil no es el de alguien que solo maneja en ciudad, y según la aseguradora puede jugar a favor o en contra. Lo que no cambia es que el millaje declarado tiene que coincidir con el real.',
      ny: 'Ojo con esto si te mudaste de Nueva Jersey: Nueva York tiene sus propias reglas de seguro de auto, sus propios mínimos y su propio sistema de no-fault. La póliza tiene que estar emitida en el estado donde el carro está registrado, y comparar un precio de aquí con uno de Jersey es comparar dos productos distintos.',
    },
    'renters-insurance': {
      compact: 'Casi todo el inventario de vivienda aquí es de renta, en edificios donde una sola tubería sirve a varios apartamentos y las paredes se comparten. Por eso el reclamo más común no es robo: es daño por agua que empieza en una unidad y termina en la de abajo. Esa es la parte de responsabilidad de la póliza, la que casi nadie mira hasta que el vecino toca la puerta.',
      spread: 'El tipo de edificio cambia mucho de una zona a otra, y con él cambia quién responde por qué. Una casa de dos familias, un edificio grande con administración profesional y un condominio reparten de forma distinta la responsabilidad entre el dueño y tú. La póliza correcta depende de en cuál de esos estás.',
      small: 'Gran parte de la renta aquí son casas antiguas divididas en apartamentos, muchas con cableado y calefacción originales. El riesgo de incendio eléctrico en ese tipo de vivienda es la razón práctica por la que vale la pena tener la cobertura, incluso cuando el landlord no la exige por contrato.',
      ny: 'En Nueva York el tipo de edificio define todo. En un co-op, la línea entre lo que cubre el edificio y lo que te toca a ti está escrita en el proprietary lease, y suele ser menos favorable de lo que la gente supone. En renta estabilizada la división es otra. Vale la pena saber cuál es tu caso antes de comprar nada.',
    },
  },
  en: {
    'contractor-insurance': {
      compact: 'Working here means working tight: buildings touching each other, no driveway to stage materials, neighbors three feet from the scaffold. The risk of damaging someone else\'s property is not theoretical, it is daily, and it is exactly what the property damage side of a liability policy answers. A paint bucket on the neighbor\'s car is already a claim.',
      spread: 'Work here spreads across neighborhoods that look nothing alike: single-family homes in one part, multi-unit buildings in another, storefronts along the main corridor. Each property type brings its own contract and its own insurance requirements, and the certificate that worked on one job may not work on the next.',
      small: 'Being a small town ringed by more expensive municipalities, nearly all the work goes outward. That means clients who ask about insurance before they ask about price, and who sometimes want to see the certificate before letting you in the house. Here the COI is part of the sales pitch, not paperwork you handle later.',
      ny: 'Working in New York puts you in Department of Buildings territory: a contractor license depends on keeping general liability active, and a lapse does not just stall a job, it can stall the license. It is a stricter requirement than New Jersey\'s, and it catches people who moved here off guard.',
    },
    'cheap-auto-insurance': {
      compact: 'In a city this compact the car lives on the street. Parallel parking, mirror clips, catalytic converter theft and vandalism are the number one reason people here ask about comprehensive rather than liability. And the density itself is part of why the ZIP code prices the way it does.',
      spread: 'Driving here is a mix: short trips inside the city and long highway runs out to work. That mix matters because carriers price annual mileage and declared use, and answering those casually is a quiet way to create problems when you file a claim.',
      small: 'Driving from here usually means highway: more miles, at higher speed, out to jobs in other towns. That profile is not the same as a pure city driver, and depending on the carrier it can cut either way. What does not change is that declared mileage has to match actual mileage.',
      ny: 'Worth knowing if you moved from New Jersey: New York has its own auto insurance rules, its own minimums and its own no-fault system. The policy has to be issued in the state where the car is registered, and comparing a price here to a Jersey price is comparing two different products.',
    },
    'renters-insurance': {
      compact: 'Almost all the housing stock here is rental, in buildings where one pipe serves several apartments and walls are shared. That is why the most common claim is not theft: it is water damage that starts in one unit and ends up in the one below. That is the liability side of the policy, the part nobody looks at until the neighbor knocks.',
      spread: 'Building type varies a lot from one area to the next, and with it who answers for what. A two-family house, a large professionally managed building and a condo each split responsibility between owner and tenant differently. The right policy depends on which one you are in.',
      small: 'Much of the rental stock here is older houses cut into apartments, many with original wiring and heating. Electrical fire risk in that kind of housing is the practical reason the coverage is worth having, even when the landlord does not require it by lease.',
      ny: 'In New York the building type defines everything. In a co-op, the line between what the building covers and what falls on you is written into the proprietary lease, and it is usually less favorable than people assume. In rent-stabilized housing the split is different again. Worth knowing which one you are in before buying anything.',
    },
  },
};

/** Town-specific framing for the cost section, varied by trait and rotated. */
export const COST_NOTE = {
  es: [
    'Antes de los números, una advertencia útil: lo que sigue son rangos publicados a nivel estatal, no una cotización. Tu número depende de tu caso.',
    'Los números de abajo son rangos de referencia del estado. Sirven para saber si un precio que te dieron está dentro de lo normal, no para predecir el tuyo.',
    'Vale la pena entrar a esta conversación con un rango en la cabeza. Así, cuando te den un precio, sabes si estás en terreno razonable o no.',
    'Nadie puede darte un número real sin ver tu caso. Lo que sí se puede hacer es decirte en qué rango se mueve esto normalmente.',
  ],
  en: [
    'Before the numbers, a useful warning: what follows are published statewide ranges, not a quote. Your number depends on your situation.',
    'The numbers below are statewide reference ranges. They are useful for knowing whether a price you were given is normal, not for predicting yours.',
    'It is worth walking into this conversation with a range in your head. That way, when someone gives you a price, you know whether you are in reasonable territory.',
    'Nobody can give you a real number without seeing your case. What can be done is telling you what range this normally moves in.',
  ],
};

/** Commentary that follows the legal facts, tied back to the town. */
export const LAW_CLOSE = {
  es: {
    'contractor-insurance': [
      'La fecha que más se pasa por alto es la de renovación. Cada primavera aparecen contratistas que descubren que su registro venció, normalmente porque un cliente lo fue a verificar antes de firmar.',
      'Lo que casi nadie revisa es si la clasificación de la póliza corresponde al trabajo que realmente hace. Una póliza emitida como trabajo ligero no responde igual cuando el trabajo es estructural.',
      'Vale la pena guardar copia del registro y del certificado en el teléfono. La mayoría de los trabajos que se caen por papeles se caen porque el papel no estaba a la mano el día que lo pidieron.',
    ],
    'cheap-auto-insurance': [
      'Un detalle que cuesta caro: manejar con la póliza cancelada por falta de pago trae multas, suspensión y un recargo grande cuando vuelves a asegurarte. El ahorro de un mes se paga durante años.',
      'Si el vehículo está a nombre de un negocio, o lo usas para llevar material de clientes, la póliza personal puede no responder. Esa distinción entre uso personal y comercial es la que más reclamos negados produce.',
      'Los mínimos son eso, mínimos. Cumplirlos te mantiene legal; si alcanzan o no para el daño de un accidente real es una conversación aparte, y es la que conviene tener con un agente.',
    ],
    'renters-insurance': [
      'Si el landlord te pide comprobante, fíjate en el límite exacto que exige y en si quiere aparecer como interested party. Llegar con una póliza que no cumple el límite del contrato es llegar sin póliza.',
      'Si rentas un cuarto o vives con familia, la póliza tiene que estar a tu nombre. Tus cosas dentro de la póliza de otra persona normalmente no están cubiertas.',
      'La inundación es la exclusión que más sorprende. Se compra por separado, y en zonas bajas esa diferencia es la que decide si recuperas tus muebles o no.',
    ],
  },
  en: {
    'contractor-insurance': [
      'The date most often missed is renewal. Every spring, contractors turn up who discover their registration lapsed, usually because a client went to verify it before signing.',
      'What almost nobody checks is whether the policy classification matches the work actually being done. A policy written for light work does not respond the same way when the work is structural.',
      'Worth keeping a copy of the registration and the certificate on your phone. Most jobs that fall through over paperwork fall through because the paperwork was not to hand the day it was asked for.',
    ],
    'cheap-auto-insurance': [
      'One detail that costs dearly: driving on a policy cancelled for non-payment brings fines, suspension and a large surcharge when you re-insure. One month of savings gets paid back over years.',
      'If the vehicle is titled to a business, or you use it to haul client materials, a personal policy may not respond. That personal-versus-commercial distinction produces more denied claims than anything else.',
      'Minimums are just that, minimums. Meeting them keeps you legal; whether they are enough for the damage in a real crash is a separate conversation, and one worth having with an agent.',
    ],
    'renters-insurance': [
      'If the landlord asks for proof, check the exact limit required and whether they want to be listed as an interested party. Showing up with a policy below the contract limit is showing up with no policy.',
      'If you rent a room or live with family, the policy has to be in your name. Your belongings sitting under someone else\'s policy are usually not covered.',
      'Flood is the exclusion that surprises people most. It is bought separately, and in low-lying areas that difference decides whether you replace your furniture or not.',
    ],
  },
};
