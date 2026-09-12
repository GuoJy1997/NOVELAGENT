param(
  [Parameter(Mandatory = $true)][string]$OutFile,
  [string]$Title = 'Select folder',
  [ValidateSet('Folder', 'File')][string]$Mode = 'Folder'
)

$ErrorActionPreference = 'Stop'
$code = @'
using System;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace Novelora {
  [ComImport]
  [Guid("DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7")]
  class FileOpenDialog { }

  [ComImport]
  [Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE")]
  [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IShellItem {
    void BindToHandler(IntPtr pbc, ref Guid bhid, ref Guid riid, out IntPtr ppv);
    void GetParent(out IShellItem ppsi);
    void GetDisplayName(uint sigdnName, [MarshalAs(UnmanagedType.LPWStr)] out string ppszName);
    void GetAttributes(uint sfgaoMask, out uint psfgaoAttribs);
    void Compare(IShellItem psi, uint hint, out int piOrder);
  }

  [ComImport]
  [Guid("42f85136-db7e-439c-85f1-e4075d135fc8")]
  [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IFileDialog {
    [PreserveSig] int Show(IntPtr parent);
    void SetFileTypes(uint cFileTypes, IntPtr rgFilterSpec);
    void SetFileTypeIndex(uint iFileType);
    void GetFileTypeIndex(out uint piFileType);
    void Advise(IntPtr pfde, out uint pdwCookie);
    void Unadvise(uint dwCookie);
    void SetOptions(uint fos);
    void GetOptions(out uint pfos);
    void SetDefaultFolder(IShellItem psi);
    void SetFolder(IShellItem psi);
    void GetFolder(out IShellItem ppsi);
    void GetCurrentSelection(out IShellItem ppsi);
    void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string pszName);
    void GetFileName([MarshalAs(UnmanagedType.LPWStr)] out string pszName);
    void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string pszTitle);
    void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string pszText);
    void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string pszLabel);
    void GetResult(out IShellItem ppsi);
    void AddPlace(IShellItem psi, uint fdap);
    void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string pszDefaultExtension);
    void Close(int hr);
    void SetClientGuid(ref Guid guid);
    void ClearClientData();
    void SetFilter(IntPtr pFilter);
  }

  public static class FolderPicker {
    const uint FOS_PICKFOLDERS = 0x00000020;
    const uint FOS_FORCEFILESYSTEM = 0x00000040;
    const uint SIGDN_FILESYSPATH = 0x80058000;

    public static string Pick(string title) {
      Application.EnableVisualStyles();
      var owner = new Form();
      owner.TopMost = true;
      owner.ShowInTaskbar = false;
      owner.FormBorderStyle = FormBorderStyle.None;
      owner.StartPosition = FormStartPosition.CenterScreen;
      owner.Size = new Size(8, 8);
      owner.AllowTransparency = true;
      owner.Opacity = 0.02;
      owner.Show();
      owner.BringToFront();
      owner.Activate();
      try {
        var dialog = (IFileDialog)new FileOpenDialog();
        dialog.SetOptions(FOS_PICKFOLDERS | FOS_FORCEFILESYSTEM);
        dialog.SetTitle(title);
        var hr = dialog.Show(owner.Handle);
        if (hr != 0) return "";
        IShellItem item;
        dialog.GetResult(out item);
        string path;
        item.GetDisplayName(SIGDN_FILESYSPATH, out path);
        return path ?? "";
      } finally {
        owner.Close();
        owner.Dispose();
      }
    }

    public static string PickFile(string title) {
      Application.EnableVisualStyles();
      using (var dialog = new OpenFileDialog()) {
        dialog.Title = title;
        dialog.Filter = "Markdown / Text (*.md;*.txt)|*.md;*.txt|All files (*.*)|*.*";
        dialog.Multiselect = false;
        dialog.CheckFileExists = true;
        dialog.ShowHelp = true;
        return dialog.ShowDialog() == DialogResult.OK ? (dialog.FileName ?? "") : "";
      }
    }
  }
}
'@

Add-Type -TypeDefinition $code -Language CSharp -ReferencedAssemblies System.Windows.Forms, System.Drawing
$path = if ($Mode -eq 'File') {
  [Novelora.FolderPicker]::PickFile($Title)
} else {
  [Novelora.FolderPicker]::Pick($Title)
}
if ([string]::IsNullOrWhiteSpace($path)) {
  exit 1
}
[System.IO.File]::WriteAllText($OutFile, $path, [System.Text.UTF8Encoding]::new($false))
exit 0
