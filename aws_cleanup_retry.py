import boto3
import time
from botocore.exceptions import ClientError

REGION = 'sa-east-1'

def cleanup_stubborn_resources():
    print(f"🧹 INICIANDO LIMPIEZA FINAL EN {REGION}...")
    
    rds = boto3.client('rds', region_name=REGION)
    ec2 = boto3.client('ec2', region_name=REGION)

    # 1. RDS PRODUCTION DB (Stubborn)
    db_id = 'leximetrics-production-db'
    print(f"\n🗄️ Reintentando eliminar DB: {db_id}")
    try:
        # Intentar desactivar Deletion Protection primero
        print("  🔓 Desactivando Deletion Protection...")
        rds.modify_db_instance(
            DBInstanceIdentifier=db_id,
            DeletionProtection=False,
            ApplyImmediately=True
        )
        time.sleep(5) # Esperar propagación
        
        # Borrar de nuevo
        rds.delete_db_instance(
            DBInstanceIdentifier=db_id,
            SkipFinalSnapshot=True,
            DeleteAutomatedBackups=True
        )
        print(f"  ✅ Eliminación solicitada exitosamente para: {db_id}")
    except ClientError as e:
        print(f"  ❌ Error con DB {db_id}: {e}")

    # 2. ELASTIC IPs (Retry)
    print("\n📍 Reintentando liberar Elastic IPs...")
    addrs = ec2.describe_addresses()
    for addr in addrs.get('Addresses', []):
        alloc_id = addr['AllocationId']
        public_ip = addr['PublicIp']
        print(f"  Targeting IP: {public_ip}")
        try:
            ec2.release_address(AllocationId=alloc_id)
            print(f"  ✅ IP liberada: {public_ip}")
        except ClientError as e:
            print(f"  ❌ Error liberando IP {public_ip}: {e}")

    print("\n🏁 LIMPIEZA FINALIZADA.")

if __name__ == "__main__":
    cleanup_stubborn_resources()
