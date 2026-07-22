from app.skills_taxonomy import SKILL_TAXONOMY


def test_taxonomy_is_non_empty_list_of_strings():
    assert isinstance(SKILL_TAXONOMY, list)
    assert len(SKILL_TAXONOMY) > 20
    assert all(isinstance(skill, str) and skill.strip() for skill in SKILL_TAXONOMY)


def test_taxonomy_has_no_duplicates():
    # Duplicate entries would make PhraseMatcher double-count a skill hit,
    # inflating a candidate's score for no reason.
    assert len(SKILL_TAXONOMY) == len(set(SKILL_TAXONOMY))


def test_taxonomy_contains_common_expected_skills():
    expected_subset = {"Python", "React", "SQL", "Docker", "Communication"}
    assert expected_subset.issubset(set(SKILL_TAXONOMY))
