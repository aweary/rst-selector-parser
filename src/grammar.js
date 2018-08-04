import P from 'parsimmon';

export const Parser = P.createLanguage({
  start: r => P.seqMap(
    r.selector,
    P.seq(r.combinator, r.selector).many(),
    (selector, next) => next.reduce((prev, [combinator, selector]) => {
      return [...prev, combinator, selector];
    }, [selector])
  ),

  combinator: r => P.regexp(/\s*([>+~])\s*|\s+/, 1).map(c => {
    switch (c) {
      case '+': return {type: 'adjacentSiblingCombinator'};
      case '>': return {type: 'childCombinator'};
      case '~': return {type: 'generalSiblingCombinator'};
      default: return {type: 'descendantCombinator'};
    }
  }),

  selector: r => r.selectorBody.map(body => ({type: 'selector', body})),

  selectorBody: r => P.seqMap(
    P.alt(
      r.universalSelector.map(s => [s]),
      r.typeSelector.atMost(1),
    ),
    r.simpleSelector.many(),
    (prefix, rest) => [...prefix, ...rest]
  ),

  simpleSelector: r => P.alt(
    r.idSelector,
    r.classSelector,
    r.attributeValueSelector,
    r.attributePresenceSelector,
    r.pseudoElementSelector,
    r.pseudoClassSelector,
  ),

  typeSelector: r => r.attributeName.map(name => ({type: 'typeSelector', name})),

  // see http://stackoverflow.com/a/449000/368691
  classSelector: r => P.regexp(/\.(-*[_a-zA-Z][_a-zA-Z0-9-]*)/, 1).map(name => ({type: 'classSelector', name})),

  attributeName: r => P.regexp(/-*[_a-z()A-Z][_a-zA-Z()0-9-]*/),

  // The selector used for ID name does not permit all valid HTML5 ID names.
  // In HTML5 ID value can be any string that does not include a space.
  // @see https://www.w3.org/TR/2011/WD-html5-20110525/elements.html#the-id-attribute
  //
  // I have not seen special characters being used in ID.
  // Therefore, for simplicity, attributeName regex is used here.
  //
  // If we were to respect HTML5 spec, we'd need to accomodate all special characters,
  // including [>+~:#. ].
  idSelector: r => P.seqMap(P.string("#"), r.attributeName, (_, name) => ({type: 'idSelector', name})),

  universalSelector: r => P.string("*").map(() => ({type: 'universalSelector'})),

  attributePresenceSelector: r => P.seqMap(P.string("["), r.attributeName, P.string("]"), (_l, name, _r) => ({type: 'attributePresenceSelector', name})),

  attributeOperator: r => P.alt(
    P.string("="),
    P.string("~="),
    P.string("|="),
    P.string("^="),
    P.string("$="),
    P.string("*="),
  ),

  attributeValueSelector: r => P.seqMap(P.string("["), r.attributeName, r.attributeOperator, r.attributeValue, P.string("]"),
    (_l, name, operator, value, _r) => ({type: 'attributeValueSelector', name, value, operator})
  ),

  attributeValue: r => P.alt(
    r.falsyPrimitiveStrings,
    r.numericValue,
    r.sqstring,
    r.dqstring,
  ),

  falsyPrimitiveStrings: r => P.alt(
    P.string("false").map(() => false),
    P.string("true").map(() => true),
    P.string("NaN").map(() => NaN),
    P.string("null").map(() => null),
    P.string("undefined").map(() => undefined),
  ),

  numericValue: r => P.alt(
    P.regexp(/[+-]?[0-9]+(\.[0-9]+)?/).map(Number),
    P.string("Infinity").map(() => Number.POSITIVE_INFINITY),
    P.string("+Infinity").map(() => Number.POSITIVE_INFINITY),
    P.string("-Infinity").map(() => Number.NEGATIVE_INFINITY),
  ),

  classParameters: r => r.classParameter.sepBy(P.regexp(/\s*,\s*/)),

  classParameter: r => P.alt(
    P.regexp(/[^()"', ]+/),
    r.sqstring,
    r.dqstring,
  ),

  pseudoElementSelector: r => P.seqMap(P.string("::"), r.pseudoClassSelectorName, (_, name) => ({type: 'pseudoElementSelector', name})),

  pseudoClassSelector: r => P.seqMap(
    P.string(":"), r.pseudoClassSelectorName,
    P.seqMap(P.string("("), r.classParameters, P.string(")"), (_l, parameters, _r) => parameters).atMost(1),
    (_, name, parameters) => {
      if (parameters.length) {
        return {type: 'pseudoClassSelector', name, parameters: parameters[0]};
      } else {
        return {type: 'pseudoClassSelector', name};
      }
    }
  ),

  pseudoClassSelectorName: r => P.regexp(/[a-zA-Z][a-zA-Z0-9-_]+/),

  dqstring: r => P.seqMap(
    P.string('"'),
    r.dstrchar.many(),
    P.string('"'),
    (_l, chars, _r) => chars.join('')
  ),

  dstrchar: r => P.alt(
    P.string('\\"').map(() => '"'),
    P.noneOf('"'),
  ),

  sqstring: r => P.seqMap(
    P.string("'"),
    r.sstrchar.many(),
    P.string("'"),
    (_l, chars, _r) => chars.join('')
  ),

  sstrchar: r => P.alt(
    P.string("\\'").map(() => "'"),
    P.noneOf("'"),
  ),
});
