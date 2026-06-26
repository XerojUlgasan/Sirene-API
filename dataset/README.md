# Sirene

Sirene is an open-source crowdsourced speech dataset project focused on collecting and preserving Philippine languages through community-contributed voice recordings.

The project aims to address the lack of publicly available speech resources for underrepresented Philippine languages such as Cebuano (Bisaya), Ilocano, Hiligaynon, Waray, and others.

Contributors are presented with phrases in a source language (e.g., English) and are asked to translate and speak the phrase in a target language. The resulting recordings, transcripts, and metadata are compiled into an open dataset that can be used for:

- Automatic Speech Recognition (ASR)
- Speech Translation (ST)
- Machine Translation (MT)
- Language Learning Systems
- Pronunciation Assessment
- Multilingual Language Models
- Philippine Language Research
- Code-Switched Language Research

---

# Dataset Structure

```text
sirene-dataset/

├── clips/
│   ├── clip_8c85ddc0.mp4
│   ├── clip_850f494e.mp4
│   ├── clip_b081978d.mp4
│   └── ...
│
├── metadata.csv
│
└── README.md
```

---

# Dataset Format

The dataset consists of:

- Audio recordings stored inside the `clips/` directory
- Metadata stored in `metadata.csv`

Each row in `metadata.csv` represents one recording.

Example:

```csv
clip_id,audio_path,source_language,target_language,source_prompt,audio_transcription,speaker_id,duration_seconds,submitted_at,gender,age,user_mother_tongue,tone,fluency,pronunciation,completeness,accuracy,overall_score
clip_8c85ddc0,clips/clip_8c85ddc0.mp4,english,bisaya,Where is the nearest private hospital?,Asa man ang pinakadugol nga pribadong hospital?,user_001,5.25,2026-06-25T11:42:22.673Z,m,21,bisaya,normal,95,90,100,95,95
```

---

# Column Definitions

## clip_id

Unique identifier for each recording.

Example:

```text
clip_8c85ddc0
```

Purpose:

- Primary key
- Links metadata to audio file

---

## audio_path

Relative path to the recording file.

Example:

```text
clips/clip_8c85ddc0.mp4
```

Purpose:

- Locates the audio sample

---

## source_language

Language of the original prompt.

Example:

```text
english
```

Possible values:

```text
english
tagalog
cebuano
ilocano
hiligaynon
waray
...
```

---

## target_language

Language spoken by the contributor.

Example:

```text
bisaya
```

Purpose:

- Indicates the translation target

---

## source_prompt

Original text shown to the contributor.

Example:

```text
Where is the nearest private hospital?
```

Purpose:

- Source sentence for translation

---

## audio_transcription

Text transcription of the spoken recording.

Example:

```text
Asa man ang pinakadugol nga pribadong ospital?
```

Purpose:

- Speech recognition target
- Translation target
- Linguistic analysis

---

## speaker_id

Anonymized contributor identifier.

Example:

```text
user_001
```

Purpose:

- Speaker tracking
- Prevents duplicate speaker leakage between train/test splits

Privacy Note:

No personally identifiable information is stored.

---

## duration_seconds

Length of the audio recording in seconds.

Example:

```text
5.25
```

Purpose:

- Audio statistics
- Dataset filtering

---

## submitted_at

Timestamp when the recording was submitted.

Format:

```text
ISO 8601
```

Example:

```text
2026-06-25T11:42:22.673Z
```

Purpose:

- Dataset versioning
- Temporal analysis

---

## gender

Self-reported speaker gender.

Example:

```text
m
```

Possible values:

```text
m
f
other
unknown
```

Purpose:

- Speaker diversity analysis

---

## age

Speaker age at the time of submission.

Example:

```text
21
```

Purpose:

- Demographic analysis
- Accent and pronunciation research

---

## user_mother_tongue

Speaker's native language.

Example:

```text
bisaya
```

Purpose:

- Language transfer studies
- Accent analysis
- Cross-lingual research

---

## tone

Emotional tone used during recording.

Example:

```text
normal
```

Possible values:

```text
normal
happy
sad
angry
soft
excited
fearful
neutral
```

Purpose:

- Emotion recognition research
- Expressive speech synthesis
- Prosody analysis

---

## fluency

AI-generated fluency score.

Range:

```text
0 - 100
```

Measures:

- Smoothness of speech
- Natural pacing
- Grammar quality
- Confidence

Example:

```text
95
```

---

## pronunciation

AI-generated pronunciation score.

Range:

```text
0 - 100
```

Measures:

- Clarity
- Correct articulation
- Speech intelligibility

Example:

```text
90
```

---

## completeness

AI-generated completeness score.

Range:

```text
0 - 100
```

Measures:

- Whether the entire source meaning was conveyed
- Missing or omitted information

Example:

```text
100
```

---

## accuracy

AI-generated translation accuracy score.

Range:

```text
0 - 100
```

Measures:

- Semantic correctness
- Faithfulness to the source sentence

Example:

```text
95
```

---

## overall_score

Aggregated AI evaluation score.

Range:

```text
0 - 100
```

Purpose:

- Quality filtering
- Leaderboards
- Benchmarking

Example:

```text
95
```

---

# Intended Applications

The Sirene dataset may be used for:

## Automatic Speech Recognition (ASR)

```text
Audio → Text
```

Example:

```text
Bisaya Speech → Bisaya Transcript
```

---

## Speech Translation (ST)

```text
Speech → Translation
```

Example:

```text
Bisaya Speech → English Text
```

---

## Machine Translation (MT)

```text
English Text → Bisaya Text
```

---

## Pronunciation Assessment

Evaluation of:

- Fluency
- Pronunciation
- Completeness
- Translation Accuracy

---

## Language Learning Systems

Applications that help users:

- Learn regional languages
- Practice pronunciation
- Improve translation skills

---

## Philippine Language Preservation

Sirene aims to support the preservation and technological inclusion of underrepresented Philippine languages by providing open and reusable speech resources for future researchers and developers.

---

# License

This dataset is intended to be released under an open-source license to support academic, educational, and research use.

Contributors must provide consent before their recordings are included in the dataset.

---

# Citation

If you use Sirene in your research, please cite the dataset repository and acknowledge the contributors who made the dataset possible.
