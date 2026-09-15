import asyncio
from app.routers.intelligence import verify_claims_endpoint, VerifyClaimRequest


def test_verification_supported_claim():
    request = VerifyClaimRequest(
        document_id="doc-123",
        text="Project Titan is an autonomous drone navigation system deployed on Raspberry Pi 5.",
        claims=[
            "Project Titan is an autonomous drone navigation system",
            "It runs on Raspberry Pi 5 hardware"
        ],
        chunks=[
            {"text": "Project Titan is an autonomous drone navigation system designed for low-power robotics.", "page_number": 1, "section": "Overview"},
            {"text": "The edge compute runtime was successfully deployed on Raspberry Pi 5 boards.", "page_number": 2, "section": "Hardware"}
        ]
    )

    response = asyncio.run(verify_claims_endpoint(request))
    assert response.document_id == "doc-123"
    assert response.status == "supported"
    assert response.claim_status == "EXPLICITLY STATED"
    assert len(response.claims) == 2
    assert response.claims[0].status == "SUPPORTED"
    assert response.claims[1].status == "SUPPORTED"


def test_verification_unsupported_claim():
    request = VerifyClaimRequest(
        document_id="doc-456",
        text="This document talks about agricultural crop rotation techniques in temperate climates.",
        claims=[
            "Quantum teleportation was accomplished using superconducting qubits at room temperature."
        ],
        chunks=[
            {"text": "Crop rotation involves alternating legumes with winter wheat to replenish soil nitrogen.", "page_number": 1, "section": "Agronomy"}
        ]
    )

    response = asyncio.run(verify_claims_endpoint(request))
    assert response.document_id == "doc-456"
    assert response.status == "unsupported"
    assert response.claim_status == "NOT FOUND"
    assert len(response.claims) == 1
    assert response.claims[0].status == "UNSUPPORTED"
