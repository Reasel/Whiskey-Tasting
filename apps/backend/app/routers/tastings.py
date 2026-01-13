"""Tasting management endpoints."""

from typing import Any

from fastapi import APIRouter, HTTPException

from app.database import db
from app.schemas.models import (
    ApiResponse,
    SubmitTastingRequest,
    ThemeScoresResponse,
    UserTastingsResponse,
)

router = APIRouter()


@router.post("/tastings", response_model=ApiResponse)
async def submit_tasting(request: SubmitTastingRequest) -> ApiResponse:
    """Submit tasting scores for a user."""
    try:
        # Get or create user
        user = db.get_or_create_user(request.user_name)

        # Submit each whiskey score
        for whiskey_id, scores in request.whiskey_scores.items():
            db.create_or_update_tasting(
                user_id=user["id"],
                whiskey_id=whiskey_id,
                aroma_score=scores["aroma_score"],
                flavor_score=scores["flavor_score"],
                finish_score=scores["finish_score"],
                personal_rank=scores["personal_rank"],
            )

        return ApiResponse(message="Tasting submitted successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit tasting: {str(e)}")


@router.get("/tastings/themes/{theme_id}/scores", response_model=ThemeScoresResponse)
async def get_theme_scores(theme_id: int) -> ThemeScoresResponse:
    """Get all scores for a theme."""
    try:
        theme = db.get_theme(theme_id)
        if not theme:
            raise HTTPException(status_code=404, detail="Theme not found")

        whiskeys = db.get_whiskeys_by_theme(theme_id)
        tastings = db.get_tastings_by_theme(theme_id)

        # Group tastings by whiskey
        whiskey_scores = {}
        for tasting in tastings:
            wid = tasting["whiskey_id"]
            if wid not in whiskey_scores:
                whiskey_scores[wid] = []
            user = db.get_user(tasting["user_id"])
            if user:
                whiskey_scores[wid].append({
                    "user_name": user["name"],
                    "aroma_score": tasting["aroma_score"],
                    "flavor_score": tasting["flavor_score"],
                    "finish_score": tasting["finish_score"],
                    "average_score": round((tasting["aroma_score"] + tasting["flavor_score"] + tasting["finish_score"]) / 3, 1),
                    "personal_rank": tasting["personal_rank"],
                })

        # Build response
        whiskeys_list = []
        for whiskey in whiskeys:
            wid = whiskey["id"]
            scores = whiskey_scores.get(wid, [])
            if scores:
                avg_score = round(sum(s["average_score"] for s in scores) / len(scores), 1)
                rank_by_avg = sorted([w for w in whiskeys_list if w["scores"]], key=lambda x: x["average_score"], reverse=True)
                rank = next((i+1 for i, w in enumerate(rank_by_avg) if w["whiskey_id"] == wid), len(rank_by_avg)+1)
            else:
                avg_score = 0.0
                rank = 0

            whiskeys_list.append({
                "whiskey_id": wid,
                "whiskey_name": whiskey["name"],
                "proof": whiskey.get("proof"),
                "scores": scores,
                "average_score": avg_score,
                "rank_by_average": rank,
            })

        # Sort whiskeys by average score descending
        whiskeys_list.sort(key=lambda x: x["average_score"], reverse=True)

        return ThemeScoresResponse(
            theme={
                "id": theme["id"],
                "name": theme["name"],
                "notes": theme["notes"],
                "created_at": theme["created_at"],
            },
            whiskeys=whiskeys_list,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get theme scores: {str(e)}")


@router.get("/tastings/themes/scores", response_model=list[ThemeScoresResponse])
async def get_all_themes_scores() -> list[ThemeScoresResponse]:
    """Get scores for all themes."""
    try:
        themes = db.list_themes()
        results = []
        for theme in themes:
            # Reuse the logic from get_theme_scores
            theme_id = theme["id"]
            whiskeys = db.get_whiskeys_by_theme(theme_id)
            tastings = db.get_tastings_by_theme(theme_id)

            # Group tastings by whiskey
            whiskey_scores = {}
            for tasting in tastings:
                wid = tasting["whiskey_id"]
                if wid not in whiskey_scores:
                    whiskey_scores[wid] = []
                user = db.get_user(tasting["user_id"])
                if user:
                    whiskey_scores[wid].append({
                        "user_name": user["name"],
                        "aroma_score": tasting["aroma_score"],
                        "flavor_score": tasting["flavor_score"],
                        "finish_score": tasting["finish_score"],
                        "average_score": round((tasting["aroma_score"] + tasting["flavor_score"] + tasting["finish_score"]) / 3, 1),
                        "personal_rank": tasting["personal_rank"],
                    })

            # Build response
            whiskeys_list = []
            for whiskey in whiskeys:
                wid = whiskey["id"]
                scores = whiskey_scores.get(wid, [])
                if scores:
                    avg_score = round(sum(s["average_score"] for s in scores) / len(scores), 1)
                else:
                    avg_score = 0.0

                whiskeys_list.append({
                    "whiskey_id": wid,
                    "whiskey_name": whiskey["name"],
                    "proof": whiskey.get("proof"),
                    "scores": scores,
                    "average_score": avg_score,
                    "rank_by_average": 0,  # Skip ranking for simplicity in all themes
                })

            # Sort whiskeys by average score descending
            whiskeys_list.sort(key=lambda x: x["average_score"], reverse=True)

            results.append(ThemeScoresResponse(
                theme={
                    "id": theme["id"],
                    "name": theme["name"],
                    "notes": theme["notes"],
                    "created_at": theme["created_at"],
                },
                whiskeys=whiskeys_list,
            ))

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get all themes scores: {str(e)}")


@router.get("/tastings/users/{user_name}/themes/{theme_id}", response_model=UserTastingsResponse)
async def get_user_tastings_for_theme(user_name: str, theme_id: int) -> UserTastingsResponse:
    """Get a user's tastings for a specific theme."""
    try:
        theme = db.get_theme(theme_id)
        if not theme:
            raise HTTPException(status_code=404, detail="Theme not found")

        user = db.get_user_by_name(user_name)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        tastings = db.get_user_tastings_for_theme(user["id"], theme_id)

        # Build tastings dict
        tastings_dict = {}
        for tasting in tastings:
            tastings_dict[tasting["whiskey_id"]] = {
                "aroma_score": tasting["aroma_score"],
                "flavor_score": tasting["flavor_score"],
                "finish_score": tasting["finish_score"],
                "personal_rank": tasting["personal_rank"],
            }

        return UserTastingsResponse(
            user_name=user_name,
            theme={
                "id": theme["id"],
                "name": theme["name"],
                "notes": theme["notes"],
                "created_at": theme["created_at"],
            },
            tastings=tastings_dict,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user tastings: {str(e)}")

