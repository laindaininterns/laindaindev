"""Escalation gate across the three intent tiers.

Tier 1 (rules) is tried first, it is nearly free and handles the bulk of
real traffic. Tier 2 (single-shot LLM) is tried next, and only escalates
to tier 3 (bounded agent) when it explicitly flags the request as
multi-step. This ordering is what keeps the average request fast, the
slow, expensive tier only ever runs on the minority of traffic that
actually needs it.
"""

import logging

from app.services.intent import tier1_rules, tier2_llm, tier3_agent
from app.services.intent.tier3_agent import AgentStepLimitError, AgentTimeoutError

logger = logging.getLogger("ai_pipeline.intent.router")

# Below this, we trust the tier that produced it. Otherwise we escalate
# to the next tier rather than act on a low confidence guess.
_MIN_CONFIDENCE = 0.6


async def resolve_intent(text: str) -> dict:
    rule_match = tier1_rules.match(text)
    if rule_match and rule_match["confidence"] >= _MIN_CONFIDENCE:
        return _finalize(rule_match)

    llm_result = await tier2_llm.classify(text)

    if llm_result.get("requires_multi_step"):
        try:
            agent_result = await tier3_agent.run_agent(
                text, [e.model_dump() for e in llm_result["entities"]]
            )
            return _finalize(agent_result)
        except (AgentTimeoutError, AgentStepLimitError) as exc:
            logger.warning("Tier 3 agent did not converge (%s), falling back to tier 2 result", exc)
            return _finalize(llm_result)

    return _finalize(llm_result)


def _finalize(result: dict) -> dict:
    result["requires_confirmation"] = result.get("confidence", 0) < _MIN_CONFIDENCE
    return result
