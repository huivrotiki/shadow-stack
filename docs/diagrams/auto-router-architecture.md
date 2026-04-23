# Auto Router & Ralph Loop — Visual Architecture

## 1. Router Engine (Auto Route) Flowchart

```mermaid
graph TD
    A[User Query / Instruction] --> B{Router Engine}
    B --> C{Intent Detection}
    
    C -->|code keywords| D[Code Intent]
    C -->|browser keywords| E[Browser Intent]
    C -->|short query < 50 chars| F[Short Intent]
    C -->|default| G[Default Intent]
    
    D --> H{Has Cloud Keys?}
    H -->|Groq Key| I[Groq Provider]
    H -->|OpenRouter Key| J[OpenRouter Provider]
    H -->|No Cloud| K[Ollama Provider]
    
    E --> L[Browser Provider - Chromium]
    F --> M[Ollama Provider - Fast]
    G --> N[Ollama Provider - Default]
    
    I --> O[Response via Proxy :20129]
    J --> O
    K --> O
    L --> O
    M --> O
    N --> O
    
    O --> P[ZeroClaw Orchestrator]
```

## 2. Ralph Loop (AutoResearch) Lifecycle

```mermaid
graph LR
    Start([Start Loop]) --> LoadCode[Load train.py]
    LoadCode --> EvalInitial[Evaluate Initial Metric]
    EvalInitial --> Loop{Iterations <= MAX?}
    
    Loop -->|Yes| Propose[Propose Hypothesis via LLM]
    Propose --> Validate{Valid Code?}
    
    Validate -->|Missing SYSTEM_PROMPT| Skip[Skip & Log]
    Validate -->|Valid| Apply[Apply New Code]
    
    Apply --> Eval[Evaluate New Metric]
    Eval --> Compare{Improved?}
    
    Compare -->|Yes, > Threshold| Commit[Git Commit]
    Compare -->|No| Revert[Revert to Old Code]
    
    Commit --> Loop
    Revert --> Loop
    Skip --> Loop
    
    Loop -->|No| Finish([Finish & Report Best Metric])
```

## 3. Provider Speed Profiles

```mermaid
pie title Model Speed Distribution
    "Ollama (Fast)" : 35
    "Groq (Fast)" : 25
    "OpenRouter (Medium)" : 20
    "OmniRoute (Smart)" : 15
    "Browser (Special)" : 5
```

## 4. Context Gathering Pipeline

```mermaid
sequenceDiagram
    participant U as User/ZeroClaw
    participant R as Router Engine
    participant CG as Context Gatherer
    participant SM as Supermemory
    participant NB as NotebookLM
    participant ZC as ZeroClaw HTTP
    
    U->>R: Instruction / Query
    R->>CG: Gather Context (Goal)
    CG->>SM: Recall (Promise)
    CG->>NB: Ask (Promise)
    CG->>ZC: Health Check (Promise)
    
    SM-->>CG: Memory Context
    NB-->>CG: Expert Insight
    ZC-->>CG: Service Status
    
    CG->>R: Enriched Instruction
    R->>U: Best Provider + Model
```
