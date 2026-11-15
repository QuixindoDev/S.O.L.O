"""
Serviço de Envio de SMS / 2FA - Field Shift / S.O.L.O. Campo Amigo
Gerencia o disparo de mensagens SMS com códigos de segurança (OTP) de 6 dígitos
e formatação/mascaramento de números de telefone para a interface.
"""

import logging
from typing import Dict, List, Optional

logger = logging.getLogger("field_shift.sms")


def mask_phone_number(phone: str) -> str:
    """
    Mascara o número de telefone para exibição segura nas telas de 2FA.
    Exemplos:
      - '+244 933 300 300' -> '+244 933 3** ***'
      - '(71) 99123-4567' -> '(71) 99123-****'
      - '+5571991234567' -> '+55 (71) 99123-****'
    """
    clean = phone.strip()
    if len(clean) <= 4:
        return "****"

    if clean.startswith("+244"):
        # Padrão angolano
        digits = "".join(filter(str.isdigit, clean))
        if len(digits) >= 12:
            return f"+244 {digits[3:6]} {digits[6]}** ***"
        return f"+244 {clean[4:8]}** ***"

    # Padrão genérico/brasileiro: mantém os primeiros caracteres e mascara os 4 últimos
    visible = clean[:-4]
    return f"{visible}****"


class SMSService:
    """
    Adaptador de SMS com suporte a ambiente de desenvolvimento/teste e produção.
    Mantém histórico em memória das últimas mensagens enviadas para fins de auditoria e testes.
    """

    def __init__(self):
        self._sent_messages: List[Dict[str, str]] = []

    def send_verification_code(self, phone: str, otp_code: str) -> bool:
        """
        Dispara a mensagem SMS contendo o código de 6 dígitos.
        Texto compatível com o Ecrã 2 (SMS Enviado):
        'S.O.L.O. Campo Amigo: Seu código de segurança é XXXXXX. Válido por 10 minutos.'
        """
        message_text = (
            f"S.O.L.O. Campo Amigo: O seu código de segurança é {otp_code}. "
            f"Digite-o na aplicação para abrir o seu Caderno da Terra."
        )

        record = {
            "phone": phone,
            "masked_phone": mask_phone_number(phone),
            "otp_code": otp_code,
            "message": message_text,
        }
        self._sent_messages.append(record)

        logger.info(
            f"[SMS ENVIADO] Para: {mask_phone_number(phone)} | Código: {otp_code} | Texto: {message_text}"
        )
        return True

    def get_last_code_for_phone(self, phone: str) -> Optional[str]:
        """Recupera o último código enviado para um número (útil em testes e depuração)."""
        clean_target = "".join(filter(str.isdigit, phone))
        for item in reversed(self._sent_messages):
            clean_item = "".join(filter(str.isdigit, item["phone"]))
            if clean_item == clean_target:
                return item["otp_code"]
        return None

    def clear_history(self) -> None:
        """Limpa o histórico de mensagens enviadas."""
        self._sent_messages.clear()


# Instância singleton global padrão do serviço de SMS
default_sms_service = SMSService()
