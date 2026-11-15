"""
Rotas HTTP dos Módulos da Propriedade - Field Shift / S.O.L.O. Campo Amigo
Implementa os endpoints consumidos pelas telas do front-end:
  - Minha Terra e Horta (/api/v1/horta, /api/v1/plots)
  - Minhas Plantas (/api/v1/plants, /api/v1/harvests)
  - Meu Caderninho de Contas (/api/v1/finance/summary, /api/v1/finance/transactions)
  - Falar com a Agrônoma (/api/v1/agronomist/messages)
"""

import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.infrastructure.inbound.http.schemas import (
    PlotCreateRequest,
    PlotResponse,
    PlantCreateRequest,
    PlantUpdateRequest,
    PlantResponse,
    HarvestCreateRequest,
    HarvestResponse,
    HortaOverviewResponse,
    FinancialTransactionCreateRequest,
    FinancialTransactionResponse,
    FinancialSummaryResponse,
    AgronomistMessageCreateRequest,
    AgronomistMessageResponse,
)
from src.infrastructure.inbound.http.auth_middleware import get_optional_current_farmer, get_current_farmer
from src.infrastructure.outbound.persistence.models import (
    FarmerRecord,
    PlotRecord,
    PlantRecord,
    HarvestRecord,
    FinancialRecord,
    AgronomistMessageRecord,
)
from src.infrastructure.outbound.persistence.database import get_db
from src.infrastructure.outbound.persistence.seeder import seed_default_farmer_data

business_router = APIRouter(prefix="/api/v1", tags=["Módulos do Campo (Horta, Plantas, Finanças & Agrônoma)"])


def _get_or_create_target_farmer(
    current_farmer: Optional[FarmerRecord],
    db: Session,
    seed: bool = True
) -> FarmerRecord:
    """Garante a identificação do agricultor atual ou o agricultor de demonstração padrão (Dona Maria).

    `seed=False` evita repovoar os dados de demonstração — usado nos
    endpoints de remoção, senão o canteiro apagado voltava no pedido seguinte.
    """
    if current_farmer:
        if seed:
            seed_default_farmer_data(current_farmer, db)
        return current_farmer

    # Busca agricultor padrão ou cria Dona Maria
    default_f = db.query(FarmerRecord).filter(FarmerRecord.telefone == "+244 923 456 789").first()
    if not default_f:
        default_f = db.query(FarmerRecord).first()

    if not default_f:
        default_f = FarmerRecord(
            nome_completo="Dona Maria da Silva",
            apelido="Dona Maria",
            telefone="+244 923 456 789",
            cidade="Huambo",
            estado="Huíla",
            nome_sitio="Sítio Recanto Verde",
            tipo_solo="franco",
            latitude_padrao=-12.776,
            longitude_padrao=15.739,
            area_hectares=2.5,
            is_phone_verified=True,
            is_active=True,
        )
        db.add(default_f)
        db.commit()
        db.refresh(default_f)

    if seed:
        seed_default_farmer_data(default_f, db)
    return default_f


# ==============================================================================
# HORTA COMPLETA & CANTEIROS (Minha Terra e Horta)
# ==============================================================================

@business_router.get(
    "/horta",
    response_model=HortaOverviewResponse,
    summary="Visão Geral da Horta (Equivalente a horta.json)",
    description="Retorna canteiros, plantas e colheitas da agricultora no formato exato consumido pelo front-end."
)
def get_horta_overview(
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)

    plots = db.query(PlotRecord).filter(
        PlotRecord.farmer_id == target_farmer.id,
        PlotRecord.is_active.is_(True)
    ).all()
    plot_ids = [p.id for p in plots]
    plants = db.query(PlantRecord).filter(PlantRecord.plot_id.in_(plot_ids)).all() if plot_ids else []
    harvests = db.query(HarvestRecord).filter(HarvestRecord.farmer_id == target_farmer.id).all()

    return HortaOverviewResponse(
        canteiros=[
            PlotResponse(
                id=p.slug or p.uuid,
                uuid=p.uuid,
                name=p.name,
                crops=p.crops_description,
                areaM2=p.area_m2,
                icon=p.icon,
                soilTexture=p.soil_texture,
            )
            for p in plots
        ],
        plantas=[
            PlantResponse(
                id=pl.slug or pl.uuid,
                uuid=pl.uuid,
                plotId=pl.plot_uuid,
                name=pl.name,
                icon=pl.icon,
                care=pl.care,
                status=pl.status,
                tone=pl.tone,
                sowingDate=pl.sowing_date,
                harvestInDays=pl.harvest_in_days or 0,
            )
            for pl in plants
        ],
        colheitas=[
            HarvestResponse(
                id=h.uuid,
                uuid=h.uuid,
                crop=h.crop_name,
                quantity=h.quantity,
                soldAt=h.sold_at,
                date=h.harvest_date,
            )
            for h in harvests
        ],
    )


@business_router.get(
    "/plots",
    response_model=List[PlotResponse],
    summary="Listar Canteiros (Minha Terra e Horta)",
    description="Retorna os canteiros da propriedade da agricultora."
)
def list_plots(
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)
    plots = db.query(PlotRecord).filter(
        PlotRecord.farmer_id == target_farmer.id,
        PlotRecord.is_active.is_(True)
    ).all()
    return [
        PlotResponse(
            id=p.slug or p.uuid,
            uuid=p.uuid,
            name=p.name,
            crops=p.crops_description,
            areaM2=p.area_m2,
            icon=p.icon,
            soilTexture=p.soil_texture,
        )
        for p in plots
    ]


@business_router.post(
    "/plots",
    response_model=PlotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Novo Canteiro",
    description="Adiciona um novo talhão/canteiro à terra da agricultora."
)
def create_plot(
    request: PlotCreateRequest,
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)
    new_uuid = str(uuid.uuid4())
    slug = request.name.lower().replace(" ", "_")

    plot = PlotRecord(
        uuid=new_uuid,
        farmer_id=target_farmer.id,
        farmer_uuid=target_farmer.uuid,
        name=request.name.strip(),
        slug=slug,
        crops_description=request.crops.strip() if request.crops else None,
        area_m2=request.areaM2,
        icon=request.icon,
        soil_texture=request.soilTexture or "argiloso",
    )
    db.add(plot)
    db.commit()
    db.refresh(plot)

    return PlotResponse(
        id=plot.slug or plot.uuid,
        uuid=plot.uuid,
        name=plot.name,
        crops=plot.crops_description,
        areaM2=plot.area_m2,
        icon=plot.icon,
        soilTexture=plot.soil_texture,
    )


# ==============================================================================
# MINHAS PLANTAS (Acompanhamento e Cuidados)
# ==============================================================================

@business_router.get(
    "/plants",
    response_model=List[PlantResponse],
    summary="Listar Plantas (Minhas Plantas)",
    description="Retorna as culturas ativas nos canteiros da agricultora."
)
def list_plants(
    plot_id: Optional[str] = Query(default=None, description="Filtrar por canteiro"),
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)
    plots = db.query(PlotRecord).filter(
        PlotRecord.farmer_id == target_farmer.id,
        PlotRecord.is_active.is_(True)
    ).all()
    plot_ids = [p.id for p in plots]
    if not plot_ids:
        return []

    query = db.query(PlantRecord).filter(PlantRecord.plot_id.in_(plot_ids))
    if plot_id:
        query = query.filter((PlantRecord.plot_uuid == plot_id) | (PlantRecord.plot_id == plot_id))

    plants = query.all()
    return [
        PlantResponse(
            id=pl.slug or pl.uuid,
            uuid=pl.uuid,
            plotId=pl.plot_uuid,
            name=pl.name,
            icon=pl.icon,
            care=pl.care,
            status=pl.status,
            tone=pl.tone,
            sowingDate=pl.sowing_date,
            harvestInDays=pl.harvest_in_days or 0,
        )
        for pl in plants
    ]


@business_router.post(
    "/plants",
    response_model=PlantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Adicionar Nova Planta",
    description="Registra uma nova planta vinculada a um canteiro existente."
)
def create_plant(
    request: PlantCreateRequest,
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)

    # Localizar o canteiro
    plot = db.query(PlotRecord).filter(
        (PlotRecord.slug == request.plotId) | (PlotRecord.uuid == request.plotId),
        PlotRecord.farmer_id == target_farmer.id
    ).first()

    if not plot:
        # Fallback para o primeiro canteiro do agricultor
        plot = db.query(PlotRecord).filter(
            PlotRecord.farmer_id == target_farmer.id,
            PlotRecord.is_active.is_(True)
        ).first()
        if not plot:
            raise HTTPException(status_code=404, detail="Canteiro não encontrado.")

    plant = PlantRecord(
        plot_id=plot.id,
        plot_uuid=plot.slug or plot.uuid,
        name=request.name.strip(),
        slug=request.name.lower().replace(" ", "_"),
        icon=request.icon,
        care=request.care,
        status=request.status,
        tone=request.tone,
        sowing_date=request.sowingDate or datetime.now(timezone.utc).strftime("%Y%m%d"),
        harvest_in_days=request.harvestInDays,
    )
    db.add(plant)
    db.commit()
    db.refresh(plant)

    return PlantResponse(
        id=plant.slug or plant.uuid,
        uuid=plant.uuid,
        plotId=plant.plot_uuid,
        name=plant.name,
        icon=plant.icon,
        care=plant.care,
        status=plant.status,
        tone=plant.tone,
        sowingDate=plant.sowing_date,
        harvestInDays=plant.harvest_in_days or 0,
    )


# ==============================================================================
# COLHEITAS RECENTES
# ==============================================================================

@business_router.get(
    "/harvests",
    response_model=List[HarvestResponse],
    summary="Listar Colheitas Recentes",
    description="Retorna o histórico de colheitas vendidas na feira ou consumidas em casa."
)
def list_harvests(
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)
    harvests = db.query(HarvestRecord).filter(HarvestRecord.farmer_id == target_farmer.id).all()
    return [
        HarvestResponse(
            id=h.uuid,
            uuid=h.uuid,
            crop=h.crop_name,
            quantity=h.quantity,
            soldAt=h.sold_at,
            date=h.harvest_date,
        )
        for h in harvests
    ]


@business_router.post(
    "/harvests",
    response_model=HarvestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar Nova Colheita",
    description="Registra colheita com quantidade e destino (feira ou casa)."
)
def create_harvest(
    request: HarvestCreateRequest,
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)
    harvest = HarvestRecord(
        farmer_id=target_farmer.id,
        farmer_uuid=target_farmer.uuid,
        crop_name=request.crop.strip(),
        quantity=request.quantity.strip(),
        sold_at=request.soldAt,
        harvest_date=request.date or datetime.now(timezone.utc).strftime("%Y%m%d"),
    )
    db.add(harvest)
    db.commit()
    db.refresh(harvest)

    return HarvestResponse(
        id=harvest.uuid,
        uuid=harvest.uuid,
        crop=harvest.crop_name,
        quantity=harvest.quantity,
        soldAt=harvest.sold_at,
        date=harvest.harvest_date,
    )


# ==============================================================================
# MEU CADERNINHO DE CONTAS (Finanças da Roça)
# ==============================================================================

@business_router.get(
    "/finance/summary",
    response_model=FinancialSummaryResponse,
    summary="Resumo Financeiro (Meu Caderninho de Contas)",
    description="Calcula o dinheiro que entrou, dinheiro que saiu e o que sobrou no mês."
)
def get_financial_summary(
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)
    records = db.query(FinancialRecord).filter(
        FinancialRecord.farmer_id == target_farmer.id
    ).order_by(FinancialRecord.created_at.desc()).all()

    total_entradas = sum(r.valor for r in records if r.tipo == "entrada")
    total_saidas = sum(r.valor for r in records if r.tipo == "saida")
    saldo = total_entradas - total_saidas

    return FinancialSummaryResponse(
        mes="novembro",
        dinheiroQueEntrou=round(total_entradas, 2),
        dinheiroQueSaiu=round(total_saidas, 2),
        sobrou=round(saldo, 2),
        transacoes=[
            FinancialTransactionResponse(
                id=r.uuid,
                uuid=r.uuid,
                tipo=r.tipo,
                categoria=r.categoria,
                descricao=r.descricao,
                valor=r.valor,
                data=r.data,
            )
            for r in records
        ],
    )


@business_router.get(
    "/finance/transactions",
    response_model=List[FinancialTransactionResponse],
    summary="Listar Transações do Caderninho",
    description="Retorna todas as vendas na feira e despesas com adubo/sementes."
)
def list_financial_transactions(
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)
    records = db.query(FinancialRecord).filter(
        FinancialRecord.farmer_id == target_farmer.id
    ).order_by(FinancialRecord.created_at.desc()).all()

    return [
        FinancialTransactionResponse(
            id=r.uuid,
            uuid=r.uuid,
            tipo=r.tipo,
            categoria=r.categoria,
            descricao=r.descricao,
            valor=r.valor,
            data=r.data,
        )
        for r in records
    ]


@business_router.post(
    "/finance/transactions",
    response_model=FinancialTransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Novo Lançamento no Caderninho",
    description="Registra uma nova receita ou despesa agrícola."
)
def create_financial_transaction(
    request: FinancialTransactionCreateRequest,
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)
    now_label = datetime.now(timezone.utc).strftime("%d de nov")
    record = FinancialRecord(
        farmer_id=target_farmer.id,
        farmer_uuid=target_farmer.uuid,
        tipo=request.tipo.lower(),
        categoria=request.categoria.lower(),
        descricao=request.descricao.strip(),
        valor=request.valor,
        data=request.data or now_label,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return FinancialTransactionResponse(
        id=record.uuid,
        uuid=record.uuid,
        tipo=record.tipo,
        categoria=record.categoria,
        descricao=record.descricao,
        valor=record.valor,
        data=record.data,
    )


# ==============================================================================
# FALAR COM A AGRÔNOMA (Canal de Ajuda e Suporte Técnico)
# ==============================================================================

@business_router.get(
    "/agronomist/messages",
    response_model=List[AgronomistMessageResponse],
    summary="Mensagens com a Agrônoma (Ecrã 11)",
    description="Histórico de dúvidas e orientações técnicas entre a agricultora e a agrônoma Ana."
)
def get_agronomist_messages(
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)
    messages = db.query(AgronomistMessageRecord).filter(
        AgronomistMessageRecord.farmer_id == target_farmer.id
    ).order_by(AgronomistMessageRecord.created_at.asc()).all()

    return [
        AgronomistMessageResponse(
            id=m.uuid,
            uuid=m.uuid,
            sender=m.sender,
            senderName=m.sender_name,
            message=m.message_text,
            isRead=m.is_read,
            time=m.created_at.strftime("%H:%M") if m.created_at else "11:45",
        )
        for m in messages
    ]


@business_router.post(
    "/agronomist/messages",
    response_model=AgronomistMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enviar Mensagem para a Agrônoma",
    description="Envia dúvida técnica da agricultora e gera confirmação de recebimento."
)
def send_agronomist_message(
    request: AgronomistMessageCreateRequest,
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)
    sender_name = target_farmer.apelido or target_farmer.nome_completo

    msg = AgronomistMessageRecord(
        farmer_id=target_farmer.id,
        farmer_uuid=target_farmer.uuid,
        sender="farmer",
        sender_name=sender_name,
        message_text=request.message.strip(),
        is_read=True,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return AgronomistMessageResponse(
        id=msg.uuid,
        uuid=msg.uuid,
        sender=msg.sender,
        senderName=msg.sender_name,
        message=msg.message_text,
        isRead=msg.is_read,
        time=msg.created_at.strftime("%H:%M"),
    )


# ==============================================================================
# PERFIL DA PROPRIEDADE (dados que alimentam toda a app)
# ==============================================================================

@business_router.get(
    "/profile",
    summary="Perfil da Propriedade (dono, terra e localização)",
    description=(
        "Devolve os dados que o front-end usa em todos os ecrãs: nome, sítio, cidade/estado, "
        "coordenadas, textura do solo e área em hectares. "
        "Com token Bearer devolve o perfil de quem está autenticado; sem token devolve o "
        "agricultor de demonstração."
    ),
)
def get_profile(
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)

    city = target_farmer.cidade or "Huambo"
    state = target_farmer.estado or "Huíla"
    user_name = target_farmer.apelido or target_farmer.nome_completo

    return {
        "id": target_farmer.uuid,
        "uuid": target_farmer.uuid,
        "userName": user_name,
        "farmName": target_farmer.nome_sitio or "Sítio Recanto Verde",
        "city": city,
        "state": state,
        "locationLabel": f"{city} - {state}",
        "latitude": target_farmer.latitude_padrao if target_farmer.latitude_padrao is not None else -12.776,
        "longitude": target_farmer.longitude_padrao if target_farmer.longitude_padrao is not None else 15.739,
        "soil": target_farmer.tipo_solo or "argiloso",
        "areaHectares": target_farmer.area_hectares if target_farmer.area_hectares is not None else 2.5,
        "phone": target_farmer.telefone,
        "cooperativa": target_farmer.cooperativa,
    }


# ==============================================================================
# ATUALIZAÇÃO E REMOÇÃO (canteiros e plantas)
# ==============================================================================

def _find_plot(db: Session, target_farmer: FarmerRecord, plot_ref: str) -> Optional[PlotRecord]:
    return db.query(PlotRecord).filter(
        (PlotRecord.uuid == plot_ref) | (PlotRecord.slug == plot_ref),
        PlotRecord.farmer_id == target_farmer.id,
        PlotRecord.is_active.is_(True)
    ).first()


def _find_plant(db: Session, target_farmer: FarmerRecord, plant_ref: str) -> Optional[PlantRecord]:
    return db.query(PlantRecord).join(PlotRecord).filter(
        (PlantRecord.uuid == plant_ref) | (PlantRecord.slug == plant_ref),
        PlotRecord.farmer_id == target_farmer.id,
        PlotRecord.is_active.is_(True)
    ).first()


@business_router.patch(
    "/plants/{plant_ref}",
    response_model=PlantResponse,
    summary="Actualizar Estado e Cuidados de uma Planta",
    description="Actualiza o status, os cuidados, o tom visual ou os dias até à colheita.",
)
def update_plant(
    plant_ref: str,
    request: PlantUpdateRequest,
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db)
    plant = _find_plant(db, target_farmer, plant_ref)
    if not plant:
        raise HTTPException(status_code=404, detail="Planta não encontrada.")

    if request.status is not None:
        plant.status = request.status
    if request.care is not None:
        plant.care = request.care
    if request.tone is not None:
        plant.tone = request.tone
    if request.harvestInDays is not None:
        plant.harvest_in_days = request.harvestInDays

    db.commit()
    db.refresh(plant)

    return PlantResponse(
        id=plant.slug or plant.uuid,
        uuid=plant.uuid,
        plotId=plant.plot_uuid,
        name=plant.name,
        icon=plant.icon,
        care=plant.care,
        status=plant.status,
        tone=plant.tone,
        sowingDate=plant.sowing_date,
        harvestInDays=plant.harvest_in_days or 0,
    )


@business_router.delete(
    "/plants/{plant_ref}",
    status_code=status.HTTP_200_OK,
    summary="Remover Planta da Horta",
    description="Elimina a planta (e os registos de colheita dela não são afectados).",
)
def delete_plant(
    plant_ref: str,
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db, seed=False)
    plant = _find_plant(db, target_farmer, plant_ref)
    if not plant:
        raise HTTPException(status_code=404, detail="Planta não encontrada.")

    db.delete(plant)
    db.commit()
    return {"mensagem": "Planta removida com sucesso.", "uuid": plant_ref}


@business_router.delete(
    "/plots/{plot_ref}",
    status_code=status.HTTP_200_OK,
    summary="Remover Canteiro (Horta)",
    description=(
        "Elimina o canteiro de forma lógica (soft delete): deixa de aparecer, "
        "e as plantas que estavam nele deixam de ser listadas."
    ),
)
def delete_plot(
    plot_ref: str,
    farmer: Optional[FarmerRecord] = Depends(get_optional_current_farmer),
    db: Session = Depends(get_db)
):
    target_farmer = _get_or_create_target_farmer(farmer, db, seed=False)
    plot = _find_plot(db, target_farmer, plot_ref)
    if not plot:
        raise HTTPException(status_code=404, detail="Canteiro não encontrado.")

    plot.is_active = False
    db.commit()
    return {"mensagem": "Canteiro removido com sucesso.", "uuid": plot.uuid}
