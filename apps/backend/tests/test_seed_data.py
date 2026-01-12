"""Test to seed the backend with sample tasting data."""

import pytest


@pytest.mark.asyncio
async def test_seed_sample_data(api_client):
    """Seed the backend with sample tasting data for testing purposes."""
    # Step 1: Create a theme
    theme_data = {
    "num_whiskeys": 4,
        "name": "Sample Bourbon Tasting",
        "notes": "A sample tasting night with bourbon whiskeys"
    }
    response = await api_client.post("/themes", json=theme_data)
    assert response.status_code == 200
    theme_response = response.json()
    theme_id = theme_response["theme"]["id"]
    print(f"Created theme: {theme_response['theme']['name']} (ID: {theme_id})")

    # Step 2: Add whiskeys to the theme
    whiskeys = [
        {"name": "Jim Beam White Label", "proof": 80.0},
        {"name": "Maker's Mark", "proof": 90.0},
        {"name": "Woodford Reserve", "proof": 90.4},
        {"name": "Buffalo Trace", "proof": 90.0}
    ]
    response = await api_client.put(f"/themes/{theme_id}/whiskeys", json={"whiskeys": whiskeys})
    assert response.status_code == 200
    print(f"Added {len(whiskeys)} whiskeys to theme")

    # Step 3: Get whiskeys to get their IDs
    response = await api_client.get(f"/themes/{theme_id}/whiskeys")
    assert response.status_code == 200
    whiskey_list = response.json()
    whiskey_ids = [w["id"] for w in whiskey_list]
    print(f"Whiskey IDs: {whiskey_ids}")

    # Step 4: Submit tastings from multiple users
    users_and_scores = [
        {
            "user_name": "Alice Johnson",
            "whiskey_scores": {
                whiskey_ids[0]: {"aroma_score": 4, "flavor_score": 4, "finish_score": 3, "personal_rank": 2},
                whiskey_ids[1]: {"aroma_score": 5, "flavor_score": 5, "finish_score": 4, "personal_rank": 1},
                whiskey_ids[2]: {"aroma_score": 3, "flavor_score": 4, "finish_score": 4, "personal_rank": 3},
                whiskey_ids[3]: {"aroma_score": 4, "flavor_score": 3, "finish_score": 3, "personal_rank": 4}
            }
        },
        {
            "user_name": "Bob Smith",
            "whiskey_scores": {
                whiskey_ids[0]: {"aroma_score": 3, "flavor_score": 3, "finish_score": 4, "personal_rank": 3},
                whiskey_ids[1]: {"aroma_score": 4, "flavor_score": 4, "finish_score": 5, "personal_rank": 1},
                whiskey_ids[2]: {"aroma_score": 4, "flavor_score": 5, "finish_score": 4, "personal_rank": 2},
                whiskey_ids[3]: {"aroma_score": 2, "flavor_score": 3, "finish_score": 2, "personal_rank": 4}
            }
        },
        {
            "user_name": "Charlie Brown",
            "whiskey_scores": {
                whiskey_ids[0]: {"aroma_score": 4, "flavor_score": 4, "finish_score": 3, "personal_rank": 2},
                whiskey_ids[1]: {"aroma_score": 3, "flavor_score": 3, "finish_score": 3, "personal_rank": 4},
                whiskey_ids[2]: {"aroma_score": 5, "flavor_score": 5, "finish_score": 5, "personal_rank": 1},
                whiskey_ids[3]: {"aroma_score": 4, "flavor_score": 4, "finish_score": 4, "personal_rank": 3}
            }
        }
    ]

    for user_data in users_and_scores:
        response = await api_client.post("/tastings", json=user_data)
        assert response.status_code == 200
        print(f"Submitted tasting for {user_data['user_name']}")

    # Step 5: Verify data by fetching theme scores
    response = await api_client.get(f"/tastings/themes/{theme_id}/scores")
    assert response.status_code == 200
    scores_data = response.json()
    print(f"Theme scores fetched successfully. Theme: {scores_data['theme']['name']}")
    print(f"Number of whiskeys with scores: {len(scores_data['whiskeys'])}")

    # Verify each whiskey has scores from all users
    for whiskey in scores_data["whiskeys"]:
        assert len(whiskey["scores"]) == len(users_and_scores), f"Whiskey {whiskey['whiskey_name']} should have {len(users_and_scores)} scores"
        print(f"Whiskey {whiskey['whiskey_name']}: {len(whiskey['scores'])} scores, avg: {whiskey['average_score']:.2f}")

    print("Sample data seeding completed successfully!")