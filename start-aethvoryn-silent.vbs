' Silent launcher for AETHVORYN Ecosystem (runs start-aethvoryn.bat hidden in background)
Option Explicit

Dim fso, shell, dirPath, batPath
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

dirPath = fso.GetParentFolderName(WScript.ScriptFullName)
If fso.FileExists(dirPath & "\start-aethvoryn.bat") Then
    batPath = dirPath & "\start-aethvoryn.bat"
Else
    batPath = "c:\Users\dakos\OneDrive\Documents\AntiGravity\3d Site\start-aethvoryn.bat"
End If

shell.CurrentDirectory = dirPath
' 0 = hidden window, False = do not block
shell.Run """" & batPath & """", 0, False
