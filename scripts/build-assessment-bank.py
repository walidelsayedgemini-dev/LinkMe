#!/usr/bin/env python3
"""Build original English practice items; never call this script at web request time.

Generation: gpt-6-luna (medium). Independent answer/ambiguity check: gpt-6.1-sol
(low), selected from the live model catalog. Outputs are cached for resumable runs.
The bank is a teaching aid, not a calibrated or officially certified CEFR exam.
"""
from __future__ import annotations
import concurrent.futures
import hashlib
import json
from pathlib import Path
import random
import re
import threading
import time
from collections import Counter
from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / '.question-work'
OUT = ROOT / 'server/content/assessment/bank.json'
COUNTS = {'A1': 180, 'A2': 180, 'B1': 180, 'B2': 180, 'C1': 160, 'C2': 120}
SKILLS = ['grammar', 'vocabulary', 'usage', 'reading']
GENERATOR = 'gpt-6-luna'
REVIEWER = 'gpt-6.1-sol'
LOCK = threading.Lock()
FATAL = threading.Event()
REPAIRS = 0
TOPICS = {
    'A1': ['introductions and classroom objects', 'family and describing people', 'home and rooms', 'food and daily shopping', 'daily routine and times', 'directions and local transport', 'clothes and weather', 'hobbies and simple invitations', 'school and sports'],
    'A2': ['holidays and past events', 'plans and appointments', 'health and advice', 'shopping and comparisons', 'work routines and experiences', 'directions and transport changes', 'home and neighbourhood', 'invitations and polite requests', 'weekend activities and arrangements'],
    'B1': ['travel problems and hotel arrangements', 'workplace decisions and emails', 'education and study strategies', 'personal experiences and plans', 'technology and daily life', 'community events and volunteering', 'health and lifestyle choices', 'environment and local action', 'relationships and conflict resolution'],
    'B2': ['workplace negotiation and tact', 'media literacy and evidence', 'education policy and alternatives', 'environmental trade-offs', 'technology and privacy', 'culture and interpretation', 'business planning and uncertainty', 'public transport and urban policy', 'research summaries and argument structure'],
    'C1': ['academic argument and qualifications', 'professional diplomacy and implied meaning', 'policy evaluation and nuanced conclusions', 'literary tone and rhetorical purpose', 'scientific communication and hedging', 'organisational change and concessions', 'precise collocations and register', 'critical interpretation of contrasting sources'],
    'C2': ['fine shades of implication and irony', 'rhetorical ambiguity and stance', 'synthesising competing arguments', 'idiomatic precision in professional prose', 'literary interpretation and register', 'subtle logical scope and qualification'],
}
DESCRIPTORS = {
    'A1': 'Basic familiar phrases and simple personal details. Simple present, be/have, articles, plurals, pronouns, basic prepositions. Very short explicit notices. No advanced tense or inference.',
    'A2': 'Routine direct exchanges; everyday descriptions and needs. Simple past, present continuous, basic future, comparisons, quantity and advice. Short simple messages and clear factual inference.',
    'B1': 'Connected language about familiar topics and most travel situations. Present perfect/past contrast, first/second conditionals with explicit cues, relative clauses, basic passive/reported speech. Main ideas and simple reasons in connected texts.',
    'B2': 'Complex concrete/abstract ideas, viewpoint and trade-offs. Tense sequencing, modal deduction with explicit evidence, third conditionals, passive/reporting and linking devices. Evaluate tone, main argument and inference in developed texts. Not only rare words.',
    'C1': 'Demanding text and implicit meaning; flexible academic/professional use. Hedging, scope, inversion with clear cues, concession, idiomatic collocation and register distinctions; 90-150 word demanding reading passages.',
    'C2': 'Very precise nuanced comprehension of complex written language, subtle shades of meaning and coherent synthesis. Pragmatics, rhetorical stance, idiomatic nuance, logical scope. 110-180 word reading passages with credible plausible distractors. Do not claim speaking/listening proficiency.',
}
Q_SCHEMA = {
    'type': 'object', 'additionalProperties': False,
    'properties': {
        'skill': {'type': 'string', 'enum': SKILLS},
        'format': {'type': 'string', 'enum': ['choice', 'gap', 'reading', 'dialogue']},
        'prompt': {'type': 'string'}, 'context': {'type': 'string'},
        'options': {'type': 'array', 'items': {'type': 'string'}, 'minItems': 4, 'maxItems': 4},
        'answer': {'type': 'integer', 'minimum': 0, 'maximum': 3},
        'explanationAr': {'type': 'string'},
    },
    'required': ['skill', 'format', 'prompt', 'context', 'options', 'answer', 'explanationAr'],
}
BATCH_SCHEMA = {'type': 'object', 'additionalProperties': False, 'properties': {'questions': {'type': 'array', 'items': Q_SCHEMA, 'minItems': 20, 'maxItems': 20}}, 'required': ['questions']}
CHECK_SCHEMA = {
    'type': 'object', 'additionalProperties': False,
    'properties': {'reviews': {'type': 'array', 'minItems': 20, 'maxItems': 20, 'items': {
        'type': 'object', 'additionalProperties': False,
        'properties': {'index': {'type': 'integer', 'minimum': 0, 'maximum': 19}, 'issue': {'type': 'string'}, 'replacement': {'anyOf': [Q_SCHEMA, {'type': 'null'}]}},
        'required': ['index', 'issue', 'replacement'],
    }}}, 'required': ['reviews'],
}


def call(model, messages, schema, effort='low'):
    if FATAL.is_set():
        raise RuntimeError('Batch stopped after a fatal provider error')
    client = OpenAI(timeout=300, max_retries=2)
    try:
        response = client.chat.completions.create(
            model=model, messages=messages, max_completion_tokens=22000,
            extra_body={'reasoning': {'effort': effort}},
            response_format={'type': 'json_schema', 'json_schema': {'name': 'assessment_items', 'strict': True, 'schema': schema}},
        )
        provider_error = getattr(response, 'error', None)
        if provider_error:
            raise RuntimeError(str(provider_error))
        content = response.choices[0].message.content
        if not content:
            raise RuntimeError('Model returned no usable content')
        return json.loads(content)
    except Exception as exc:
        message = str(exc).casefold()
        if any(term in message for term in ['insufficient credits', 'unsupported model', 'invalid session', 'blocked user', 'not ready', 'incorrect api key']):
            FATAL.set()
            raise RuntimeError('Fatal provider error: generation stopped; retained completed batches') from exc
        raise


def validate(q):
    if set(q) != set(Q_SCHEMA['required']):
        raise ValueError('Unexpected question fields')
    if q['skill'] not in SKILLS or q['format'] not in Q_SCHEMA['properties']['format']['enum']:
        raise ValueError('Unknown skill/format')
    if type(q['answer']) is not int or not 0 <= q['answer'] <= 3:
        raise ValueError('Invalid answer')
    for field in ['prompt', 'context', 'explanationAr']:
        if not isinstance(q[field], str):
            raise ValueError('Non-text content')
        q[field] = q[field].strip()
    q['options'] = [str(x).strip() for x in q['options']]
    if len(q['options']) != 4 or len({x.casefold() for x in q['options']}) != 4 or any(not x for x in q['options']):
        raise ValueError('Options must be four distinct nonempty strings')
    if len(q['prompt']) < 8 or len(q['explanationAr']) < 18 or not re.search('[\u0600-\u06ff]', q['explanationAr']):
        raise ValueError('Missing prompt or Arabic explanation')
    if q['skill'] == 'reading' and len(q['context'].split()) < 12:
        raise ValueError('Reading question needs a meaningful passage')
    return q


def signature(q):
    return re.sub(r'\s+', ' ', (q['prompt'] + ' ' + q['context']).casefold()).strip()


def review(level, items):
    global REPAIRS
    checked = call(REVIEWER, [
        {'role': 'system', 'content': 'You are a strict independent English assessment editor. Solve every item independently before comparing its marked answer. Check all four alternatives, grammatical correctness, uniqueness of the answer, sufficient context, skill classification, plausible CEFR-target difficulty, and Egyptian Arabic explanation. A grammatical distractor is not wrong just because the author intended another tense. Temporal cues and pragmatic context must make the intended answer uniquely best. Fix ambiguity, factual errors, poor reading inference and incorrect explanations. Return one review for EVERY index 0..19. Use issue empty and replacement null only if fully suitable; otherwise provide a complete corrected replacement preserving its original skill. Do not mention answer letters in explanations.'},
        {'role': 'user', 'content': f'Target {level}: {DESCRIPTORS[level]}\nReview all items:\n' + json.dumps(items, ensure_ascii=False)},
    ], CHECK_SCHEMA)
    reviews = checked['reviews']
    if {r['index'] for r in reviews} != set(range(20)):
        raise ValueError('Review did not cover every item')
    fixed = list(items)
    changes = 0
    for r in reviews:
        if r['replacement'] is not None:
            replacement = validate(r['replacement'])
            if replacement['skill'] != items[r['index']]['skill']:
                raise ValueError('Reviewer changed skill distribution')
            fixed[r['index']] = replacement
            changes += 1
        elif r['issue'].strip():
            raise ValueError('Issue left without a replacement')
    with LOCK:
        REPAIRS += changes
    return fixed, changes


def build_batch(level, number):
    path = WORK / f'{level}-{number:02d}.json'
    if path.exists():
        data = json.loads(path.read_text())
        items = [validate(q) for q in data['questions']]
        if len(items) != 20 or Counter(q['skill'] for q in items) != Counter({s: 5 for s in SKILLS}):
            raise ValueError('Invalid cached batch')
        return level, number, items
    topic = TOPICS[level][number]
    prompt = (
        f'Write exactly 20 original single-answer English questions for adult Egyptian learners at approximate CEFR {level}. '
        f'Batch theme: {topic}. Target: {DESCRIPTORS[level]}\n'
        'Exactly 5 grammar, 5 vocabulary, 5 usage, 5 reading. Four distinct English options and zero-based answer. '
        'Each question has a clearly unique best answer, not a matter of preference. '
        'Provide explicit context when other tenses/forms would be grammatical. Context is English, empty string only when unnecessary. '
        'Make vocabulary contextual, usage natural short dialogues/requests, grammar gap prompts, and reading meaningful separate ORIGINAL passages (not one repeated notice). '
        'Every reading passage must contain at least 14 words, including A1/A2. Reading formats must be reading; usage mostly dialogue; grammar mostly gap. Use varied situations and sentence patterns, not renamed clones. '
        'Questions/options in English; explanationAr a concise accurate explanation in friendly Egyptian Arabic referencing the actual correct wording, not its letter/index. '
        'Avoid cultural stereotypes, sensitive personal data, vulgarity, obscure factual trivia, all-of-the-above options, copyrighted exam excerpts, and claims of official certification. '
        'For all reading questions the answer must follow from supplied passage, not outside knowledge. '
        'Keep A1/A2 genuinely elementary and C1/C2 genuinely demanding rather than only long vocabulary.'
    )
    generated = call(GENERATOR, [{'role': 'system', 'content': 'You write careful educational English assessment items. Output exactly the requested structured data.'}, {'role': 'user', 'content': prompt}], BATCH_SCHEMA, 'medium')
    items = [validate(q) for q in generated['questions']]
    if Counter(q['skill'] for q in items) != Counter({s: 5 for s in SKILLS}):
        raise ValueError('Wrong skill distribution')
    items, changed = review(level, items)
    path.write_text(json.dumps({'questions': items, 'reviewed': True, 'corrections': changed}, ensure_ascii=False, indent=2) + '\n')
    return level, number, items


def main():
    WORK.mkdir(exist_ok=True)
    assert sum(COUNTS.values()) == 1000
    tasks = [(level, number) for level, count in COUNTS.items() for number in range(count // 20)]
    # Pilot before fan-out: retain the reviewed pilot as the first production batch.
    first = build_batch(*tasks[0])
    print('Pilot: 20 structurally valid, independently reviewed A1 items ready.', flush=True)
    results = {(first[0], first[1]): first[2]}
    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(build_batch, *task): task for task in tasks[1:]}
        for future in concurrent.futures.as_completed(futures):
            task = futures[future]
            try:
                level, number, items = future.result()
                results[(level, number)] = items
                print(f'Reviewed {len(results)}/50 batches ({len(results)*20}/1000 questions)', flush=True)
            except Exception as exc:
                failures.append(task)
                print(f'Batch {task} failed: {type(exc).__name__}: {str(exc)[:160]}', flush=True)
    # One targeted retry, retaining all successful cached batches.
    if FATAL.is_set():
        raise RuntimeError('Stopped after a fatal provider error')
    for task in failures:
        level, number, items = build_batch(*task)
        results[(level, number)] = items
    bank, seen = [], set()
    duplicate_schema = {'type': 'object', 'additionalProperties': False, 'properties': {'question': Q_SCHEMA}, 'required': ['question']}
    for level, number in tasks:
        for j, question in enumerate(results[(level, number)]):
            q = dict(question)
            if signature(q) in seen:
                repaired = call(REVIEWER, [{'role': 'system', 'content': 'Create a genuinely new unambiguous English question preserving level and skill, with an accurate Arabic explanation and exactly four options. No word-for-word paraphrases.'}, {'role': 'user', 'content': f'Target {level}: {DESCRIPTORS[level]}. Replace this duplicate with a NEW topic and construction: ' + json.dumps(q, ensure_ascii=False)}], duplicate_schema)
                q = validate(repaired['question'])
                if q['skill'] != question['skill'] or signature(q) in seen:
                    raise ValueError('Unresolved duplicate')
            seen.add(signature(q))
            # Vary correct option position without changing the actual answer.
            rng = random.Random(hashlib.sha256(f'{level}-{number}-{j}'.encode()).hexdigest())
            permutation = list(range(4))
            rng.shuffle(permutation)
            q['options'] = [q['options'][k] for k in permutation]
            q['answer'] = permutation.index(q['answer'])
            bank.append({'id': f'{level}-{number*20+j+1:04d}', 'level': level, **q})
    assert len(bank) == 1000 and len(seen) == 1000
    assert Counter(q['level'] for q in bank) == Counter(COUNTS)
    assert len({q['id'] for q in bank}) == 1000
    OUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUT.with_suffix('.tmp.json')
    temporary.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(OUT)
    report = {'total': len(bank), 'uniquePromptsAndContexts': len(seen), 'levels': COUNTS, 'skills': dict(Counter(q['skill'] for q in bank)), 'generator': GENERATOR, 'reviewer': REVIEWER, 'reviewedBatches': len(results), 'correctionsThisRun': REPAIRS, 'limitation': 'Text-only educational approximation; not empirically calibrated or CEFR-certified; no speaking/listening test.'}
    (OUT.parent / 'quality.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print('DONE: 1000 unique reviewed questions saved, with Arabic explanations.', flush=True)


if __name__ == '__main__':
    main()
