"""
Módulo de Povoamento Inicial (Seeder) - Field Shift / S.O.L.O. Campo Amigo
Garante que todo agricultor novo ou padrão possua os dados demonstrativos
completos da Horta, Plantas, Colheitas, Caderninho de Contas e Mensagens
em perfeita sintonia com horta.json e as telas do front-end.
"""

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from src.infrastructure.outbound.persistence.models import (
    FarmerRecord,
    PlotRecord,
    PlantRecord,
    HarvestRecord,
    FinancialRecord,
    AgronomistMessageRecord,
)


def seed_default_farmer_data(farmer: FarmerRecord, db: Session) -> None:
    """Preenche a propriedade com os canteiros, plantas e contas padrão se estiverem ausentes."""
    # 1. Canteiros canônicos de horta.json
    #    Inclui os canteiros removidos (is_active = False) para que não
    #    voltem a ser semeados a cada pedido.
    existing_plots = {
        p.slug: p for p in db.query(PlotRecord).filter(PlotRecord.farmer_id == farmer.id).all() if p.slug
    }

    canonical_plots = [
        {
            "slug": "canteiro_principal",
            "name": "Canteiro Principal",
            "crops": "Alface, Couve e Tomate Cereja",
            "area_m2": 120.0,
            "icon": "sprout",
            "soil": "argiloso",
        },
        {
            "slug": "horta_cozinha",
            "name": "Horta da Cozinha",
            "crops": "Cebolinha, Manjericão e Salsinha",
            "area_m2": 45.0,
            "icon": "carrot",
            "soil": "franco",
        },
        {
            "slug": "baixa_riacho",
            "name": "Baixa do Riacho",
            "crops": "Feijão e Milho",
            "area_m2": 800.0,
            "icon": "bean",
            "soil": "argiloso",
        },
    ]

    for cp in canonical_plots:
        if cp["slug"] not in existing_plots:
            new_plot = PlotRecord(
                farmer_id=farmer.id,
                farmer_uuid=farmer.uuid,
                name=cp["name"],
                slug=cp["slug"],
                crops_description=cp["crops"],
                area_m2=cp["area_m2"],
                icon=cp["icon"],
                soil_texture=cp["soil"],
            )
            db.add(new_plot)
            db.flush()
            existing_plots[cp["slug"]] = new_plot

    p1 = existing_plots.get("canteiro_principal")
    p2 = existing_plots.get("horta_cozinha")
    p3 = existing_plots.get("baixa_riacho")

    # 2. Plantas canônicas
    existing_plant_slugs = {
        pl.slug for pl in db.query(PlantRecord).join(PlotRecord).filter(PlotRecord.farmer_id == farmer.id).all() if pl.slug
    }

    canonical_plants = [
        (p1, "Tomate Cereja", "tomate_cereja", "sprout", "Precisa de estaca agora", "Florindo", "primary", "20260920", 12),
        (p1, "Alface", "alface", "leaf", "Pode colher em 3 dias", "Pronta", "primary", "20261028", 3),
        (p1, "Couve", "couve", "leaf", "Rega de 2 em 2 dias", "Crescendo", "neutral", "20261015", 25),
        (p3, "Feijão", "feijao", "bean", "Solo seco, precisa de água", "Com sede", "neutral", "20260905", 30),
        (p2, "Cebolinha", "cebolinha", "carrot", "Corte as folhas de cima", "Cortando", "primary", "20261005", 5),
    ]

    for target_plot, name, slug, icon, care, status_text, tone, sowing_date, harvest_in_days in canonical_plants:
        if target_plot and slug not in existing_plant_slugs:
            pl = PlantRecord(
                plot_id=target_plot.id,
                plot_uuid=target_plot.slug or target_plot.uuid,
                name=name,
                slug=slug,
                icon=icon,
                care=care,
                status=status_text,
                tone=tone,
                sowing_date=sowing_date,
                harvest_in_days=harvest_in_days,
            )
            db.add(pl)
            existing_plant_slugs.add(slug)

    # 3. Colheitas
    existing_harvests_count = db.query(HarvestRecord).filter(HarvestRecord.farmer_id == farmer.id).count()
    if existing_harvests_count == 0:
        db.add_all([
            HarvestRecord(farmer_id=farmer.id, farmer_uuid=farmer.uuid, crop_name="Alface", quantity="12 cabeças", sold_at="feira", harvest_date="20261114"),
            HarvestRecord(farmer_id=farmer.id, farmer_uuid=farmer.uuid, crop_name="Tomate", quantity="8 kg", sold_at="feira", harvest_date="20261112"),
            HarvestRecord(farmer_id=farmer.id, farmer_uuid=farmer.uuid, crop_name="Cebolinha", quantity="3 maços", sold_at="casa", harvest_date="20261110"),
        ])

    # 4. Caderninho de Contas
    existing_fin_count = db.query(FinancialRecord).filter(FinancialRecord.farmer_id == farmer.id).count()
    if existing_fin_count == 0:
        db.add_all([
            FinancialRecord(farmer_id=farmer.id, farmer_uuid=farmer.uuid, tipo="entrada", categoria="feira", descricao="Venda de alface na feira", valor=240.00, data="12 de nov"),
            FinancialRecord(farmer_id=farmer.id, farmer_uuid=farmer.uuid, tipo="entrada", categoria="feira", descricao="Venda de tomate e couve na feira", valor=1240.00, data="08 de nov"),
            FinancialRecord(farmer_id=farmer.id, farmer_uuid=farmer.uuid, tipo="saida", categoria="adubo", descricao="Compra de adubo orgânico", valor=185.00, data="10 de nov"),
            FinancialRecord(farmer_id=farmer.id, farmer_uuid=farmer.uuid, tipo="saida", categoria="sementes", descricao="Sementes de milho e feijão", valor=435.50, data="04 de nov"),
        ])

    # 5. Mensagens com a Agrônoma
    existing_msg_count = db.query(AgronomistMessageRecord).filter(AgronomistMessageRecord.farmer_id == farmer.id).count()
    if existing_msg_count == 0:
        db.add_all([
            AgronomistMessageRecord(farmer_id=farmer.id, farmer_uuid=farmer.uuid, sender="agronomist", sender_name="Ana - Agrônoma", message_text="Bom dia, Dona Maria! Vi que o solo da Baixa do Riacho está com 35% de umidade. Já estou a ver isso.", is_read=True),
            AgronomistMessageRecord(farmer_id=farmer.id, farmer_uuid=farmer.uuid, sender="agronomist", sender_name="Ana - Agrônoma", message_text="Bom dia, Dona Maria! Vi que o solo da Baixa do Riacho está seco. Quer que eu passe aí de manhã?", is_read=True),
            AgronomistMessageRecord(farmer_id=farmer.id, farmer_uuid=farmer.uuid, sender="farmer", sender_name=farmer.apelido or farmer.nome_completo, message_text="Sim, por favor. Depois das 9h.", is_read=True),
            AgronomistMessageRecord(farmer_id=farmer.id, farmer_uuid=farmer.uuid, sender="agronomist", sender_name="Ana - Agrônoma", message_text="Combinado, Dona Maria! Vou levar um balde de esterco para ajudar. Não se preocupe com nada.", is_read=True),
        ])

    db.commit()
