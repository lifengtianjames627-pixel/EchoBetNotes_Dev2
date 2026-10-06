# Multi-Agent Development Workflow

This is the required orchestration protocol for the Base44-to-Next.js migration. It adapts the
orchestrator-worker pattern to Cursor's native subagents.

## 1. Cursor execution model

Cursor can create context-isolated subagents and return their reports to the parent Agent. It does
not provide persistent custom role classes named `planner`, `developer`, `checker`, or
`load-tester`. The Main Agent creates those roles by:

1. selecting a suitable general-purpose subagent;
2. including the role contract from this document in its prompt;
3. providing the exact task, context, allowed files, and acceptance criteria;
4. collecting the response and deciding the next transition;
5. resuming the same subagent when continuity is required.

Subagents do not coordinate directly. All delegation, conflict avoidance, retries, and synthesis
belong to the Main Agent.

## 2. Roles

### Main Agent — orchestrator

Responsibilities:

- read `DEVELOPMENT_CHARTER.md` before scheduling work;
- turn the user request into a milestone and maintain its state;
- create Plan, Dev, Check, and Load subagents;
- provide each subagent all required context; never assume it sees the parent conversation;
- allocate file ownership and prevent overlapping writers;
- synthesize reports and decide state transitions;
- resume the original Dev Agent after a failed check;
- stop for user decisions at charter stop conditions;
- deliver the final evidence summary.

The Main Agent MUST NOT mark its own implementation as independently reviewed.

### Type 1 — Plan Agent

Mode: read-only.

Inputs:

- milestone objective and non-goals;
- current repository state;
- relevant architecture and contracts;
- known findings and constraints.

Required output:

```yaml
milestone: string
assumptions: []
risks: []
tasks:
  - id: M1-T1
    objective: string
    depends_on: []
    owned_files: []
    read_only_context: []
    acceptance_criteria: []
    verification: []
    rollback_or_recovery: string
parallel_groups: []
open_decisions: []
```

Rules:

- tasks must be atomic, independently reviewable, and normally finish in one Dev Agent run;
- define contracts before assigning consumers;
- include data migration, auth, error, observability, and cleanup work where applicable;
- do not edit files or implement code;
- do not invent completion evidence.

The Plan Agent plans a milestone or a repair strategy, not every trivial keystroke.

### Type 2 — Dev Agent

Mode: write access restricted to assigned files.

Inputs:

- exactly one task ID;
- objective, non-goals, and acceptance criteria;
- owned file list;
- applicable contracts and checker feedback;
- commands permitted by project rules.

Required output:

```yaml
task_id: M1-T1
status: complete | blocked
changed_files: []
behavior_changes: []
commands_run: []
test_results: []
data_created: []
data_cleanup: []
remaining_risks: []
blocker: null
```

Rules:

- inspect before editing;
- implement only the assigned task;
- never edit another active Dev Agent's owned files;
- do not weaken tests, validation, types, authorization, lint, or error handling to make checks pass;
- no compatibility shim may silently preserve a Base44 runtime dependency;
- do not commit, push, deploy, read `.env`, access production, or use real PII;
- if scope or contract is wrong, stop and return `blocked`;
- run focused verification before returning.

### Type 3 — Check Agent

Mode: read-only review. It may run non-mutating checks and local tests.

Inputs:

- task contract and acceptance criteria;
- Dev Agent report;
- current diff and relevant surrounding code.

Required output:

```yaml
task_id: M1-T1
verdict: PASS | FAIL | BLOCKED
findings:
  - severity: critical | high | medium | low
    file: path
    line: number-or-range
    evidence: string
    impact: string
    required_fix: string
commands_run: []
results: []
acceptance_criteria:
  - criterion: string
    result: PASS | FAIL | NOT_RUN
cleanup_verified: true | false | not_applicable
residual_risks: []
```

The Check Agent MUST inspect:

- correctness and complete acceptance coverage;
- authentication and authorization;
- input/output validation and HTTP semantics;
- SQL constraints, transaction boundaries, query bounds, and concurrency;
- error states, privacy, accessibility, and localization as applicable;
- tests for both success and failure paths;
- accidental Base44 coupling;
- unrelated changes.

Rules:

- never edit the implementation under review;
- every failure needs reproducible evidence and a concrete required fix;
- stylistic preference alone is not a failure;
- missing evidence is `NOT_RUN`, not `PASS`;
- any critical/high finding, failed applicable check, or cleanup failure means `FAIL`.

### Type 4 — Load and Resilience Agent

Mode: may create test scripts/reports only when assigned; may run tests only against an isolated
local or staging environment explicitly named by the Main Agent.

Preconditions:

- all functional tasks in the milestone passed Check;
- target is not production;
- test data isolation and cleanup mechanism are proven;
- workload and safety ceilings are approved in the milestone plan.

Required output:

```yaml
milestone: M1
verdict: PASS | FAIL | BLOCKED
target: local | isolated-staging
test_run_id: string
workloads: []
limits:
  max_vus: number
  max_requests: number
  max_duration: string
results:
  p50_ms: number
  p95_ms: number
  p99_ms: number
  error_rate: number
  throughput_rps: number
invariants_checked: []
failures: []
cleanup:
  attempted: true
  verified: true | false
  remaining_records: 0
artifacts: []
recommendations: []
```

Rules:

- generate a unique test run ID and attach it to every test-owned row and log;
- prefer a disposable local database or disposable managed PostgreSQL branch;
- cleanup runs in `finally`, including after interruption or failed assertions;
- verify cleanup with queries; “cleanup command ran” is insufficient;
- test timeouts, invalid input, concurrency, retries, idempotency, and dependency failure—not only throughput;
- stop immediately on data leakage, authorization bypass, runaway error rate, or safety ceiling breach;
- never run against production or real user accounts;
- cleanup failure makes the verdict `FAIL`.

## 3. State machine

```text
REQUESTED
  -> PLANNING
  -> READY
  -> DEVELOPING(task)
  -> CHECKING(task)

CHECKING(task) -- FAIL --> REPAIRING(same Dev Agent)
REPAIRING      ----------> CHECKING(task)

CHECKING(task) -- PASS and tasks remain --> DEVELOPING(next task/new Dev Agent)
CHECKING(task) -- PASS and no tasks remain --> MILESTONE_REVIEW

MILESTONE_REVIEW -- hot path changed --> LOAD_TESTING
MILESTONE_REVIEW -- no load gate -----> COMPLETE

LOAD_TESTING -- FAIL --> PLANNING(repair task)
LOAD_TESTING -- PASS --> COMPLETE

Any state --> BLOCKED when a charter stop condition is reached
```

Maximum repair cycles for the same task: three. After the third failure, the Main Agent stops the
loop and asks a Plan Agent for root-cause decomposition. It does not repeatedly prompt the Dev
Agent with the same instructions.

## 4. Scheduling rules

- Parallelize read-only exploration freely when domains are independent.
- Parallelize Dev Agents only when their `owned_files` sets are disjoint and their contracts are
  already stable.
- Database schema/migrations, shared API types, auth primitives, root layout, package manifests,
  and global configuration have exclusive ownership and are serialized.
- Do not run a Check Agent while its Dev Agent is still writing.
- Do not start downstream consumers before the provider contract passes Check.
- A newly discovered dependency returns control to the Main Agent; subagents do not silently
  enlarge their assignment.

## 5. Required handoff packet

Every subagent prompt must contain:

1. absolute repository path;
2. role and whether edits are allowed;
3. task ID, objective, non-goals, and acceptance criteria;
4. files it owns and files it may inspect;
5. architecture and API/database contracts that apply;
6. known preceding changes;
7. permitted verification commands;
8. privacy, environment, and cleanup constraints;
9. exact output format.

“Review/fix the project” is not a valid assignment.

## 6. Milestone ledger

For a large migration, the Main Agent creates one durable ledger under:

```text
docs/plans/active/<milestone-id>.md
```

Only the Main Agent edits the ledger. It records task states, agent reports, checks, decisions,
and artifacts. On completion it moves the final record to:

```text
docs/plans/completed/<milestone-id>.md
```

The ledger is evidence, not a substitute for automated tests.

## 7. Canonical orchestration loop

```text
1. Main asks Plan Agent for a milestone plan.
2. Main validates dependencies, file ownership, and stop decisions.
3. Main creates one Dev Agent per ready independent task.
4. Main waits for each Dev report.
5. Main creates a fresh Check Agent for each completed task.
6. On FAIL, Main resumes the same Dev Agent with the full finding list.
7. Main requests a fresh Check after repair.
8. On PASS, Main schedules newly unblocked tasks with fresh Dev Agents.
9. When all tasks pass, Main performs milestone review.
10. If required, Main creates the Load Agent.
11. Main verifies cleanup and reports evidence, gaps, and next milestone.
```

## 8. Example prompts

### Plan Agent

```text
You are the read-only Plan Agent for milestone <id>. Read DEVELOPMENT_CHARTER.md,
docs/architecture/TARGET_ARCHITECTURE.md, and docs/agents/WORKFLOW.md. Inspect the relevant code.
Do not edit files. Produce the required YAML plan with atomic tasks, exclusive file ownership,
acceptance criteria, verification, migration risks, and open decisions.
```

### Dev Agent

```text
You are the Dev Agent for <task-id>. You may edit only <owned-files>. Implement <objective>.
Non-goals: <non-goals>. Acceptance criteria: <criteria>. Follow DEVELOPMENT_CHARTER.md.
Do not commit, push, deploy, read secrets, use production, or touch real data. Run <checks>.
Return the required YAML report. Stop if the contract requires files outside your ownership.
```

### Check Agent

```text
You are the read-only Check Agent for <task-id>. Do not edit files. Compare the current diff
against <criteria>, DEVELOPMENT_CHARTER.md, and the architecture contracts. Run <checks>.
Return PASS/FAIL/BLOCKED in the required YAML format with file/line evidence. Treat skipped
applicable checks as NOT_RUN, never PASS.
```

### Load Agent

```text
You are the Load and Resilience Agent for <milestone>. Target only <isolated-target>.
Never touch production. Use run ID <id>, enforce <ceilings>, and clean all test data in finally.
Verify zero remaining records. Test <workloads and invariants>. Return the required YAML report;
cleanup failure is FAIL.
```

