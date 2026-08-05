from app.utils.lang_detect import detect_language, looks_like_roman_urdu


def test_detects_urdu_script():
    assert detect_language("یہ کتنے کا ہے؟") == "ur"


def test_detects_english():
    assert detect_language("How much is this?") == "en"


def test_empty_string_defaults_to_english():
    assert detect_language("") == "en"


def test_flags_roman_urdu_markers():
    assert looks_like_roman_urdu("yeh kitna hai bhai") is True


def test_does_not_flag_plain_english():
    assert looks_like_roman_urdu("how much is this") is False
