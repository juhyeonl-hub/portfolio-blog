param([switch]$SelfTest)
$ErrorActionPreference = 'Stop'
if ([IntPtr]::Size -ne 8) { throw '64-bit PowerShell required' }
# Query metadata only: no memory read/write, dump, injection or page protection change.
Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
public static class A2bcImageRegions {
    [StructLayout(LayoutKind.Explicit, Size=48)]
    public struct Region {
        [FieldOffset(0)] public ulong Base;
        [FieldOffset(8)] public ulong Allocation;
        [FieldOffset(16)] public uint AllocationProtect;
        [FieldOffset(24)] public ulong Size;
        [FieldOffset(32)] public uint State;
        [FieldOffset(36)] public uint Protect;
        [FieldOffset(40)] public uint Type;
    }
    public sealed class Summary {
        public ulong ImageBytes, ReadableBytes, UnreadableBytes;
        public int Regions, GuardRegions, UncommittedRegions;
    }
    [DllImport("kernel32.dll", SetLastError=true)]
    static extern IntPtr OpenProcess(uint access, bool inherit, int pid);
    [DllImport("kernel32.dll", SetLastError=true)]
    static extern UIntPtr VirtualQueryEx(IntPtr process, IntPtr address, out Region region, UIntPtr size);
    [DllImport("kernel32.dll")]
    static extern bool CloseHandle(IntPtr handle);
    public static bool IsReadable(uint state, uint protect) {
        if (state != 0x1000 || (protect & 0x100) != 0) return false;
        uint basic=protect & 0xff;
        return basic==2 || basic==4 || basic==8 || basic==0x20 || basic==0x40 || basic==0x80;
    }
    public static Summary Probe(int pid, long start, int bytes) {
        if (pid<=0 || start<=0 || bytes<=0) throw new ArgumentException("Invalid module range");
        var handle=OpenProcess(0x0400, false, pid); // PROCESS_QUERY_INFORMATION only.
        if (handle==IntPtr.Zero) throw new Win32Exception(Marshal.GetLastWin32Error());
        try {
            ulong position=(ulong)start, end=checked(position+(ulong)bytes);
            var result=new Summary {ImageBytes=(ulong)bytes};
            while(position<end) {
                if (++result.Regions>10000) throw new InvalidOperationException("Region limit exceeded");
                Region region;
                if (VirtualQueryEx(handle,new IntPtr((long)position),out region,new UIntPtr(48)).ToUInt64()!=48)
                    throw new Win32Exception(Marshal.GetLastWin32Error());
                ulong next=Math.Min(end,checked(region.Base+region.Size));
                if (region.Base>position || next<=position) throw new InvalidOperationException("Invalid region extent");
                ulong size=next-position;
                if(IsReadable(region.State,region.Protect))result.ReadableBytes+=size;
                else result.UnreadableBytes+=size;
                if((region.Protect & 0x100)!=0)result.GuardRegions++;
                if(region.State!=0x1000)result.UncommittedRegions++;
                position=next;
            }
            return result;
        } finally { CloseHandle(handle); }
    }
}
'@
if ($SelfTest) {
    foreach ($flag in @(2,4,8,32,64,128)) {
        if (-not [A2bcImageRegions]::IsReadable(4096,$flag)) { throw 'Readable page classification failed' }
        if ([A2bcImageRegions]::IsReadable(4096,($flag -bor 256))) { throw 'Guard classification failed' }
        if ([A2bcImageRegions]::IsReadable(8192,$flag)) { throw 'Reserved classification failed' }
    }
    foreach ($flag in @(0,1,16,256)) {
        if ([A2bcImageRegions]::IsReadable(4096,$flag)) { throw 'Unreadable classification failed' }
    }
    $rejected = $false
    try { [A2bcImageRegions]::Probe(0,1,1) | Out-Null } catch { $rejected = $true }
    if (-not $rejected) { throw 'Invalid PID accepted' }
    $target = Get-Process -Id $PID
} else {
    $expectedPath = 'C:\Program Files (x86)\Steam\steamapps\common\AION2\Aion2\Binaries\Win64\AION2.exe'
    $target = Get-Process AION2 -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $expectedPath } | Sort-Object WorkingSet64 -Descending | Select-Object -First 1
    if (-not $target) { throw 'Verified Global Steam process unavailable' }
}
$module = $target.MainModule
$summary = [A2bcImageRegions]::Probe($target.Id,$module.BaseAddress.ToInt64(),$module.ModuleMemorySize)
if (($summary.ReadableBytes + $summary.UnreadableBytes) -ne $summary.ImageBytes) { throw 'Incomplete image coverage' }
[pscustomobject]@{SelfTest=[bool]$SelfTest; MetadataOnly=$true; Summary=$summary} | ConvertTo-Json -Depth 3 -Compress
